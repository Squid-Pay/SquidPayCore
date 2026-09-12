import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import express from "express";
import { chatWithSquidAi } from "./lib/ai.js";
import { CORE_CAPABILITIES, FULL_PLATFORM_URL, coreVariantPayload } from "./lib/platform.js";
import { SUPPORTED_WALLETS, isSupportedWallet, normalizeAddress, verifyWalletSignature } from "./lib/verify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIE_NAME = "squid_core_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const NONCE_TTL_MS = 1000 * 60 * 5;

const sessions = new Map();
const nonces = new Map();

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`
  );
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function pruneExpired() {
  const now = Date.now();
  for (const [id, row] of sessions) {
    if (now - row.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
  for (const [id, row] of nonces) {
    if (now - row.createdAt > NONCE_TTL_MS) nonces.delete(id);
  }
}

function currentSession(req) {
  pruneExpired();
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) return null;
  return sessions.get(token) || null;
}

function publicSession(session) {
  if (!session) return { connected: false, variant: "core" };
  return {
    connected: true,
    variant: "core",
    provider: session.provider,
    address: session.address,
    family: session.family,
    chain: session.chain,
    connectedAt: session.createdAt
  };
}

function buildNonceMessage(nonce) {
  return [
    "Squid Pay Core — prove you control this wallet.",
    "This does not move funds. Core never asks for a seed phrase.",
    `Nonce: ${nonce}`,
    `Issued for: ${FULL_PLATFORM_URL}`
  ].join("\n");
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      variant: "core",
      product: "Squid Pay Core",
      fullPlatform: FULL_PLATFORM_URL
    });
  });

  app.get("/api/core", (_req, res) => {
    res.json({
      variant: "core",
      product: "Squid Pay Core",
      message: "This is a core variant. Wallet connect and Squid AI run here. Everything else is on the full platform.",
      included: CORE_CAPABILITIES,
      wallets: SUPPORTED_WALLETS,
      fullPlatform: FULL_PLATFORM_URL
    });
  });

  app.get("/api/session", (req, res) => {
    res.json(publicSession(currentSession(req)));
  });

  app.get("/api/session/nonce", (_req, res) => {
    pruneExpired();
    const nonce = randomBytes(16).toString("hex");
    const message = buildNonceMessage(nonce);
    nonces.set(nonce, { createdAt: Date.now(), message });
    res.json({ nonce, message, expiresInMs: NONCE_TTL_MS });
  });

  app.post("/api/session/connect", (req, res) => {
    const { provider, address, chain, nonce, signature } = req.body || {};
    if (!isSupportedWallet(provider)) {
      return res.status(400).json({
        error: "Choose MetaMask, Coinbase Wallet, Phantom, or Backpack."
      });
    }
    if (!nonce || !nonces.has(nonce)) {
      return res.status(400).json({ error: "Session nonce expired. Request a new one and sign again." });
    }
    const issued = nonces.get(nonce);
    nonces.delete(nonce);

    try {
      const verified = verifyWalletSignature({
        provider,
        address,
        message: issued.message,
        signature
      });
      const token = randomBytes(24).toString("hex");
      const session = {
        provider: String(provider).toLowerCase(),
        address: verified.address,
        family: verified.family,
        chain: String(chain || (verified.family === "solana" ? "solana" : "evm")),
        createdAt: Date.now()
      };
      sessions.set(token, session);
      setSessionCookie(res, token);
      return res.json(publicSession(session));
    } catch (error) {
      return res.status(400).json({ error: error.message || "Wallet verification failed." });
    }
  });

  app.post("/api/session/disconnect", (req, res) => {
    const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
    if (token) sessions.delete(token);
    clearSessionCookie(res);
    res.json({ connected: false, variant: "core" });
  });

  app.post("/api/ai/chat", async (req, res) => {
    const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const messages = incoming
      .filter((row) => row && (row.role === "user" || row.role === "assistant") && typeof row.content === "string")
      .slice(-16)
      .map((row) => ({ role: row.role, content: row.content.slice(0, 4000) }));

    if (!messages.length) {
      return res.status(400).json({ error: "Send at least one chat message." });
    }

    try {
      const result = await chatWithSquidAi(messages, currentSession(req));
      res.json({
        variant: "core",
        source: result.source,
        message: result.message
      });
    } catch (error) {
      res.status(502).json({ error: error.message || "Squid AI is unavailable." });
    }
  });

  app.get("/api/wallet/status", (req, res) => {
    const session = currentSession(req);
    if (!session) {
      return res.json({
        connected: false,
        wallets: SUPPORTED_WALLETS,
        message: "Connect MetaMask, Coinbase Wallet, Phantom, or Backpack to start a Core session."
      });
    }
    res.json({
      connected: true,
      ...publicSession(session),
      normalized: normalizeAddress(session.provider, session.address)
    });
  });

  app.get("/api/platform/:feature", (req, res) => {
    const feature = String(req.params.feature || "").toLowerCase();
    if (CORE_CAPABILITIES.includes(feature)) {
      return res.json({
        variant: "core",
        available: true,
        feature,
        message: "This surface is included in Squid Pay Core."
      });
    }
    res.json(coreVariantPayload(feature));
  });

  app.use(express.static(path.join(__dirname, "public")));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found." });
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  return app;
}

export function resetCoreState() {
  sessions.clear();
  nonces.clear();
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.env.PORT || 4173);
  const app = createApp();
  app.listen(port, () => {
    console.log(`Squid Pay Core http://localhost:${port}`);
    console.log(`Full platform ${FULL_PLATFORM_URL}`);
  });
}

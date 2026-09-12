import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import bs58 from "bs58";
import { Wallet } from "ethers";
import nacl from "tweetnacl";
import { createApp, resetCoreState } from "../server.js";

async function startApp() {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const httpServer = app.listen(0, "127.0.0.1", () => resolve(httpServer));
  });
  const { port } = server.address();
  return { server, base: `http://127.0.0.1:${port}` };
}

async function json(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function cookieFrom(response) {
  const raw = response.headers.getSetCookie?.() || [];
  const header = raw[0] || response.headers.get("set-cookie") || "";
  return header.split(";")[0];
}

describe("Squid Pay Core API", () => {
  const servers = [];

  afterEach(async () => {
    resetCoreState();
    await Promise.all(
      servers.splice(0).map(
        (server) =>
          new Promise((resolve) => {
            server.close(resolve);
          })
      )
    );
  });

  async function boot() {
    const started = await startApp();
    servers.push(started.server);
    return started.base;
  }

  it("reports the core variant", async () => {
    const base = await boot();
    const health = await json(base, "/api/health");
    assert.equal(health.data.variant, "core");
    assert.equal(health.data.fullPlatform, "https://squidpay.dev");

    const core = await json(base, "/api/core");
    assert.deepEqual(core.data.included, ["home", "wallet", "chat", "ai"]);
    assert.deepEqual(core.data.wallets, ["metamask", "coinbase", "phantom", "backpack"]);
  });

  it("gates full-platform features to squidpay.dev", async () => {
    const base = await boot();
    const { data } = await json(base, "/api/platform/cards");
    assert.equal(data.variant, "core");
    assert.equal(data.available, false);
    assert.equal(data.cta.url, "https://squidpay.dev");
    assert.match(data.message, /core variant/i);
  });

  it("keeps wallet and AI marked as core", async () => {
    const base = await boot();
    const wallet = await json(base, "/api/platform/wallet");
    const ai = await json(base, "/api/platform/ai");
    assert.equal(wallet.data.available, true);
    assert.equal(ai.data.available, true);
  });

  it("connects an EVM wallet after a valid signature", async () => {
    const base = await boot();
    const wallet = Wallet.createRandom();
    const nonce = await json(base, "/api/session/nonce");
    const signature = await wallet.signMessage(nonce.data.message);
    const connected = await json(base, "/api/session/connect", {
      method: "POST",
      body: {
        provider: "metamask",
        address: wallet.address,
        chain: "0x1",
        nonce: nonce.data.nonce,
        signature
      }
    });
    assert.equal(connected.response.status, 200);
    assert.equal(connected.data.connected, true);
    assert.equal(connected.data.provider, "metamask");
    assert.equal(connected.data.address, wallet.address.toLowerCase());

    const cookie = cookieFrom(connected.response);
    const session = await json(base, "/api/session", { headers: { cookie } });
    assert.equal(session.data.address, wallet.address.toLowerCase());
  });

  it("connects a Solana wallet after a valid signature", async () => {
    const base = await boot();
    const keypair = nacl.sign.keyPair();
    const address = bs58.encode(keypair.publicKey);
    const nonce = await json(base, "/api/session/nonce");
    const signature = Buffer.from(
      nacl.sign.detached(Buffer.from(nonce.data.message, "utf8"), keypair.secretKey)
    ).toString("base64");
    const connected = await json(base, "/api/session/connect", {
      method: "POST",
      body: {
        provider: "phantom",
        address,
        chain: "solana",
        nonce: nonce.data.nonce,
        signature
      }
    });
    assert.equal(connected.data.connected, true);
    assert.equal(connected.data.provider, "phantom");
    assert.equal(connected.data.address, address);
  });

  it("rejects a bad wallet signature", async () => {
    const base = await boot();
    const wallet = Wallet.createRandom();
    const nonce = await json(base, "/api/session/nonce");
    const other = Wallet.createRandom();
    const signature = await other.signMessage(nonce.data.message);
    const connected = await json(base, "/api/session/connect", {
      method: "POST",
      body: {
        provider: "coinbase",
        address: wallet.address,
        nonce: nonce.data.nonce,
        signature
      }
    });
    assert.equal(connected.response.status, 400);
  });

  it("answers Squid AI in core mode and points full features to squidpay.dev", async () => {
    const base = await boot();
    const { data } = await json(base, "/api/ai/chat", {
      method: "POST",
      body: {
        messages: [{ role: "user", content: "I need to issue an agent card and send a payment." }]
      }
    });
    assert.equal(data.variant, "core");
    assert.equal(data.source, "core-local");
    assert.match(data.message.content, /squidpay\.dev/i);
    assert.match(data.message.content, /core/i);
  });
});

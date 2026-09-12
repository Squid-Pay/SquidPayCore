import { FULL_PLATFORM_URL, PLATFORM_FEATURES } from "./platform.js";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

export function systemPrompt(session) {
  const wallet = session
    ? `${session.provider} on ${session.chain || session.family} (${session.address})`
    : "no wallet connected yet";
  return [
    "You are Squid AI in Squid Pay Core, the open-core variant of Squid Pay.",
    "Core can connect MetaMask, Coinbase Wallet, Phantom, and Backpack, and talk about the connected wallet.",
    "Core cannot move money, issue cards, approve holds, run MCP, or manage agents.",
    `Full platform features live at ${FULL_PLATFORM_URL}.`,
    `The current wallet session is: ${wallet}.`,
    "Never ask for a seed phrase or private key.",
    "If the user wants payments, cards, trading, agents, holds, payment links, policies, catalog, or developer keys, say this is a core variant and point them to squidpay.dev.",
    "Be concise, practical, and honest about Core limits."
  ].join(" ");
}

function lastUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user" && messages[i].content) return String(messages[i].content);
  }
  return "";
}

function mentions(text, words) {
  const hay = text.toLowerCase();
  return words.some((word) => hay.includes(word));
}

export function localSquidReply(messages, session) {
  const text = lastUserText(messages);
  const connected = Boolean(session?.address);
  const walletLine = connected
    ? `${session.provider} · ${session.address}`
    : "No wallet is connected yet. Open Wallet and choose MetaMask, Coinbase, Phantom, or Backpack.";

  if (!text.trim()) {
    return "Ask me about your connected wallet, or what Core includes versus the full Squid Pay platform.";
  }

  if (mentions(text, ["seed", "private key", "secret key", "mnemonic", "recovery phrase"])) {
    return "Squid never asks for a seed phrase or private key. Connect a browser wallet and keep signing in that wallet.";
  }

  if (mentions(text, ["hello", "hi ", "hey", "who are you", "what can you"])) {
    return [
      "I am Squid AI on the Core variant.",
      "Here I can help you connect MetaMask, Coinbase Wallet, Phantom, or Backpack, and talk about that session.",
      `Payments, cards, agents, and the rest of the console are on the full platform: ${FULL_PLATFORM_URL}.`
    ].join(" ");
  }

  if (mentions(text, ["connect", "metamask", "phantom", "backpack", "coinbase", "wallet"])) {
    return [
      walletLine,
      "Core talks to injected wallets only — MetaMask and Coinbase on EVM, Phantom and Backpack on Solana.",
      "After you connect, I can see the address and chain. Signing still happens in the wallet."
    ].join(" ");
  }

  const gatedHit = Object.entries(PLATFORM_FEATURES).find(([, meta]) =>
    mentions(text, [
      meta.title.toLowerCase(),
      meta.api.replace("squid.", ""),
      ...meta.api.split(".")
    ])
  );
  if (
    gatedHit ||
    mentions(text, [
      "pay",
      "transfer",
      "card",
      "swap",
      "trade",
      "agent",
      "hold",
      "review",
      "policy",
      "budget",
      "mcp",
      "api key",
      "cli"
    ])
  ) {
    const feature = gatedHit ? gatedHit[1] : null;
    const name = feature ? feature.title : "That full-platform feature";
    return [
      `${name} is not included in this Core variant.`,
      "Core is wallet connect plus Squid AI.",
      `Open the full Squid Pay console at ${FULL_PLATFORM_URL} for ${name.toLowerCase()} and the rest of the product.`
    ].join(" ");
  }

  if (mentions(text, ["core", "variant", "open source", "difference", "full platform"])) {
    return [
      "Squid Pay Core is the simple open variant: connect a wallet and talk to Squid AI.",
      "The main platform adds payments, cards, trading, agents, needs-review holds, payment links, policies, catalog, and developer access.",
      `Go to ${FULL_PLATFORM_URL} for those.`
    ].join(" ");
  }

  return [
    connected
      ? `Your Core session is ${session.provider} (${session.address}).`
      : "Connect a wallet on the Wallet page to give me a session to talk about.",
    "I can explain Core, help you pick MetaMask, Coinbase, Phantom, or Backpack, and send you to squidpay.dev for everything else."
  ].join(" ");
}

export async function chatWithSquidAi(messages, session) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      source: "core-local",
      message: { role: "assistant", content: localSquidReply(messages, session) }
    };
  }

  const payload = {
    model: DEFAULT_MODEL,
    temperature: 0.4,
    messages: [{ role: "system", content: systemPrompt(session) }, ...messages]
  };

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.error?.message || `Squid AI upstream failed (${response.status}).`;
    throw new Error(detail);
  }

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Squid AI returned an empty reply.");
  return {
    source: "openai",
    message: { role: "assistant", content }
  };
}

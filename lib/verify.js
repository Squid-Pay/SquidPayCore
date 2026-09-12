import { verifyMessage } from "ethers";
import bs58 from "bs58";
import nacl from "tweetnacl";

const EVM_WALLETS = new Set(["metamask", "coinbase"]);
const SOLANA_WALLETS = new Set(["phantom", "backpack"]);

export const SUPPORTED_WALLETS = ["metamask", "coinbase", "phantom", "backpack"];

export function isSupportedWallet(provider) {
  return SUPPORTED_WALLETS.includes(String(provider || "").toLowerCase());
}

export function walletFamily(provider) {
  const id = String(provider || "").toLowerCase();
  if (EVM_WALLETS.has(id)) return "evm";
  if (SOLANA_WALLETS.has(id)) return "solana";
  return null;
}

export function normalizeAddress(provider, address) {
  const family = walletFamily(provider);
  const value = String(address || "").trim();
  if (family === "evm") {
    if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
      throw new Error("Enter a valid EVM address.");
    }
    return value.toLowerCase();
  }
  if (family === "solana") {
    try {
      const bytes = bs58.decode(value);
      if (bytes.length !== 32) throw new Error("bad length");
    } catch {
      throw new Error("Enter a valid Solana address.");
    }
    return value;
  }
  throw new Error("Unsupported wallet.");
}

function decodeSolanaSignature(signature) {
  if (!signature) throw new Error("Signature is required.");
  if (typeof signature !== "string") throw new Error("Signature must be a string.");
  const trimmed = signature.trim();
  try {
    const fromB58 = bs58.decode(trimmed);
    if (fromB58.length === 64) return fromB58;
  } catch {
    // try base64 next
  }
  try {
    const fromB64 = Buffer.from(trimmed, "base64");
    if (fromB64.length === 64) return fromB64;
  } catch {
    // try hex next
  }
  const hex = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  if (/^[0-9a-fA-F]+$/.test(hex) && hex.length === 128) {
    return Buffer.from(hex, "hex");
  }
  throw new Error("Could not read that Solana signature.");
}

export function verifyWalletSignature({ provider, address, message, signature }) {
  if (!message || !signature) {
    throw new Error("Sign the Core session message in your wallet.");
  }
  const family = walletFamily(provider);
  const expected = normalizeAddress(provider, address);

  if (family === "evm") {
    const recovered = verifyMessage(message, signature).toLowerCase();
    if (recovered !== expected) {
      throw new Error("That signature does not match the connected wallet.");
    }
    return { family, address: expected };
  }

  if (family === "solana") {
    const publicKey = bs58.decode(expected);
    const sig = decodeSolanaSignature(signature);
    const ok = nacl.sign.detached.verify(Buffer.from(message, "utf8"), sig, publicKey);
    if (!ok) {
      throw new Error("That signature does not match the connected wallet.");
    }
    return { family, address: expected };
  }

  throw new Error("Unsupported wallet.");
}

export const FULL_PLATFORM_URL = process.env.SQUID_FULL_URL || "https://squidpay.dev";

export const CORE_CAPABILITIES = ["home", "wallet", "ai"];

export const PLATFORM_FEATURES = {
  payments: {
    title: "Payments",
    api: "squid.transfer",
    summary: "Send USDC and other assets to wallets, vendors, or agents after policy review."
  },
  cards: {
    title: "Agent cards",
    api: "squid.issue_card",
    summary: "Issue virtual cards for agents, attach spend policies, and review authorizations."
  },
  trading: {
    title: "Trading",
    api: "squid.swap",
    summary: "Swap and route trades across Base, Solana, and Tempo with human-in-the-loop holds."
  },
  investing: {
    title: "Investing",
    api: "squid.authorize_payment",
    summary: "Conditional buys, prediction markets, and agent-proposed positions that still need your signature."
  },
  agents: {
    title: "Agents",
    api: "squid.agents",
    summary: "Create agent keys, budgets, and permissions. Agents propose; your wallet signs."
  },
  holds: {
    title: "Needs Review",
    api: "squid.holds",
    summary: "Approve or reject held payments and trades before they reach your connected wallet."
  },
  "payment-links": {
    title: "Payment links",
    api: "squid.payment_links",
    summary: "Share request links and collect receipts once the owner wallet completes the transfer."
  },
  policies: {
    title: "Policies",
    api: "squid.set_controls",
    summary: "Daily budgets, per-transaction limits, vendor allowlists, and financial harness rules."
  },
  catalog: {
    title: "Catalog",
    api: "squid.catalog",
    summary: "AgentMail, AgentPhone, and other paid tools agents can buy under your policies."
  },
  developers: {
    title: "Developers",
    api: "squid.mcp",
    summary: "Platform API keys, MCP, Skills, and the Agent Wallet SDK against the full console."
  },
  settings: {
    title: "Settings",
    api: "squid.settings",
    summary: "Workspace profile, CLI keys, and production safety controls."
  }
};

export function coreVariantPayload(feature) {
  const meta = PLATFORM_FEATURES[feature] || {
    title: "Full platform feature",
    api: "squid.platform",
    summary: "This surface ships with the full Squid Pay console."
  };
  return {
    variant: "core",
    available: false,
    feature,
    title: meta.title,
    api: meta.api,
    summary: meta.summary,
    message:
      "This is a Squid Pay Core variant. Wallet connect and Squid AI are included here. " +
      `${meta.title} and the rest of the platform live on the full console.`,
    cta: {
      label: "Open Squid Pay",
      url: FULL_PLATFORM_URL
    }
  };
}

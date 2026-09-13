export const FULL_PLATFORM_URL = process.env.SQUID_FULL_URL || "https://squidpay.dev";

export const CORE_CAPABILITIES = ["home", "wallet", "chat", "ai"];

export const PLATFORM_FEATURES = {
  money: {
    title: "Money",
    api: "squid.transfer",
    summary: "Deposit, send, and manage balances after policy review on the full console."
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
  activity: {
    title: "Activity",
    api: "squid.activity",
    summary: "Trade intensity and the workspace activity log live on the full platform."
  },
  cli: {
    title: "Squid CLI",
    api: "squid.cli",
    summary: "Read workspace state and create proposals from the native platform CLI."
  },
  settings: {
    title: "Settings",
    api: "squid.settings",
    summary: "Workspace profile, CLI keys, and production safety controls."
  },
  help: {
    title: "Help",
    api: "squid.help",
    summary: "Docs and support for the full Squid Pay console."
  },
  payments: {
    title: "Payments",
    api: "squid.transfer",
    summary: "Send USDC and other assets to wallets, vendors, or agents after policy review."
  },
  cards: {
    title: "Agent cards",
    api: "squid.issue_card",
    summary: "Issue virtual cards for agents, attach spend policies, and review authorizations."
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

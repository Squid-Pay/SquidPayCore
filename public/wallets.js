const WALLET_META = {
  metamask: {
    id: "metamask",
    name: "MetaMask",
    family: "evm",
    install: "https://metamask.io/download/",
    mark: "M",
    color: "#f6851b"
  },
  coinbase: {
    id: "coinbase",
    name: "Coinbase Wallet",
    family: "evm",
    install: "https://www.coinbase.com/wallet",
    mark: "C",
    color: "#0052ff"
  },
  phantom: {
    id: "phantom",
    name: "Phantom",
    family: "solana",
    install: "https://phantom.app/download",
    mark: "P",
    color: "#ab9ff2"
  },
  backpack: {
    id: "backpack",
    name: "Backpack",
    family: "solana",
    install: "https://backpack.app/",
    mark: "B",
    color: "#e33e3f"
  }
};

function ethereumProviders() {
  const eth = window.ethereum;
  if (!eth) return [];
  if (Array.isArray(eth.providers) && eth.providers.length) return eth.providers;
  return [eth];
}

function detectWallets() {
  const providers = ethereumProviders();
  const metamask = providers.find((p) => p.isMetaMask && !p.isPhantom && !p.isCoinbaseWallet) || null;
  const coinbase =
    window.coinbaseWalletExtension ||
    providers.find((p) => p.isCoinbaseWallet || p.isCoinbaseBrowser) ||
    null;
  const phantom = window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null);
  const backpack = window.backpack?.solana || window.backpack || window.xnft?.solana || null;

  return {
    metamask: { ...WALLET_META.metamask, installed: Boolean(metamask), provider: metamask },
    coinbase: { ...WALLET_META.coinbase, installed: Boolean(coinbase), provider: coinbase },
    phantom: { ...WALLET_META.phantom, installed: Boolean(phantom), provider: phantom },
    backpack: { ...WALLET_META.backpack, installed: Boolean(backpack), provider: backpack }
  };
}

function bytesToBase64(bytes) {
  let binary = "";
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  view.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

async function connectEvm(detected) {
  const accounts = await detected.provider.request({ method: "eth_requestAccounts" });
  const address = accounts?.[0];
  if (!address) throw new Error(`${detected.name} did not return an account.`);
  const chainId = await detected.provider.request({ method: "eth_chainId" });
  const nonce = await api("/api/session/nonce");
  const signature = await detected.provider.request({
    method: "personal_sign",
    params: [nonce.message, address]
  });
  return api("/api/session/connect", {
    method: "POST",
    body: {
      provider: detected.id,
      address,
      chain: chainId || "evm",
      nonce: nonce.nonce,
      signature
    }
  });
}

async function connectSolana(detected) {
  const connection = await detected.provider.connect();
  const address = connection?.publicKey?.toString?.() || detected.provider.publicKey?.toString?.();
  if (!address) throw new Error(`${detected.name} did not return an account.`);
  const nonce = await api("/api/session/nonce");
  const encoded = new TextEncoder().encode(nonce.message);
  const signed = await detected.provider.signMessage(encoded, "utf8");
  const signatureBytes = signed?.signature || signed;
  return api("/api/session/connect", {
    method: "POST",
    body: {
      provider: detected.id,
      address,
      chain: "solana",
      nonce: nonce.nonce,
      signature: bytesToBase64(signatureBytes)
    }
  });
}

async function connectWallet(id) {
  const detected = detectWallets()[id];
  if (!detected) throw new Error("Unknown wallet.");
  if (!detected.installed || !detected.provider) {
    const error = new Error(`${detected.name} is not installed in this browser.`);
    error.install = detected.install;
    throw error;
  }
  return detected.family === "evm" ? connectEvm(detected) : connectSolana(detected);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

window.SquidCoreWallets = {
  WALLET_META,
  detectWallets,
  connectWallet,
  api
};

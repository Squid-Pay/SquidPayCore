const coreWallets = window.SquidCoreWallets;
const WALLET_CATALOG = coreWallets.WALLET_META;
const detectInstalledWallets = coreWallets.detectWallets;
const connectBrowserWallet = coreWallets.connectWallet;
const api = coreWallets.api;
const FULL = "https://squidpay.dev";

const state = {
  session: { connected: false },
  route: "home",
  chat: [
    {
      role: "assistant",
      content:
        "I am Squid AI. This Core console only lets me talk. Money, agents, review, CLI, and the rest stay on squidpay.dev."
    }
  ]
};

const content = document.getElementById("content");
const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("drawer-backdrop");
const appShell = document.getElementById("app-shell");
const connectGate = document.getElementById("connect-gate");
const modal = document.getElementById("modal");
const modalBackdrop = document.getElementById("modal-backdrop");

function shortAddress(address) {
  if (!address) return "";
  return address.length <= 12 ? address : `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function shortWallet(address) {
  if (!address) return "—";
  return address.length <= 10 ? address : `${address.slice(0, 4)}…${address.slice(-4)}`;
}

const ICO = {
  plus: '<svg class="btn-ico" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3.2v9.6M3.2 8h9.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  send: '<svg class="btn-ico" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.1 8h9.8M9.4 4.7 13 8l-3.6 3.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  spark: '<svg class="btn-ico" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2.2c.16 2.3 1.18 3.32 3.48 3.48C8.18 5.84 7.16 6.86 7 9.16 6.84 6.86 5.82 5.84 3.52 5.68 5.82 5.52 6.84 4.5 7 2.2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  refresh: '<svg class="btn-ico" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M13.1 8A5.1 5.1 0 1 1 11.6 4.5M13.2 2.8v3.2h-3.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  copy: '<svg class="btn-ico" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5.4" y="5.4" width="7.2" height="7.2" rx="1.2" stroke="currentColor" stroke-width="1.3"/><path d="M3.6 10.2V4.8A1.2 1.2 0 0 1 4.8 3.6h5.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isPreview() {
  return new URLSearchParams(location.search).get("preview") === "1";
}

function isConnected() {
  if (isPreview() && !state.session.connected) {
    state.session = {
      connected: true,
      provider: "email",
      address: "3SquidPayCoreDemo111111111111111111112",
      chain: "solana"
    };
  }
  return Boolean(state.session?.connected && state.session.address);
}

function setShell(connected) {
  document.body.classList.toggle("on-gate", !connected);
  document.body.classList.toggle("chat-page", connected && (state.route === "chat" || state.route === "ai"));
  appShell.hidden = !connected;
  connectGate.hidden = connected;
}

const PROVIDER_LABELS = {
  metamask: "MetaMask",
  coinbase: "Coinbase Wallet",
  phantom: "Phantom",
  backpack: "Backpack",
  email: "email"
};

function setChrome() {
  if (!isConnected()) return;
  const provider = PROVIDER_LABELS[state.session.provider] || "wallet";
  document.getElementById("wallet-chip").textContent = `Signed in with ${provider}.`;
  document.querySelectorAll(".nav-item").forEach((item) => {
    const route = item.dataset.route;
    item.classList.toggle("active", route === state.route || (state.route === "ai" && route === "chat"));
  });
}

function closeMenu() {
  sidebar.classList.remove("open");
  backdrop.hidden = true;
}

function openMenu() {
  sidebar.classList.add("open");
  backdrop.hidden = false;
}

function closeModal() {
  modal.hidden = true;
  modalBackdrop.hidden = true;
  modal.innerHTML = "";
}

function openCoreModal(title, copy) {
  modal.hidden = false;
  modalBackdrop.hidden = false;
  modal.innerHTML = `
    <div class="banner">Core variant</div>
    <h2>${escapeHtml(title)}</h2>
    <p class="muted">${escapeHtml(copy)}</p>
    <p>This is a Squid Pay Core variant. Only Squid AI / Chat works here. Open the full console for this action.</p>
    <div class="modal-actions">
      <button class="pill" id="modal-cancel" type="button">Cancel</button>
      <a class="btn-blue" href="${FULL}" target="_blank" rel="noreferrer">Open Squid Pay</a>
    </div>
  `;
  document.getElementById("modal-cancel").onclick = closeModal;
}

function walletCardsHtml() {
  const detected = detectInstalledWallets();
  return Object.values(WALLET_CATALOG)
    .map((wallet) => {
      const live = detected[wallet.id];
      const status = live.installed ? "Detected in this browser" : "Install to connect";
      return `
        <button class="wallet-card ${live.installed ? "ready" : ""}" data-wallet="${wallet.id}" type="button">
          <span class="wallet-mark" style="background:${wallet.color}">${wallet.mark}</span>
          <span>
            <h3>${wallet.name}</h3>
            <p>${wallet.family === "evm" ? "EVM" : "Solana"} · ${status}</p>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderConnectGate() {
  setShell(false);
  closeMenu();
  closeModal();
  const list = document.getElementById("gate-wallets");
  list.innerHTML = walletCardsHtml();
  const errorEl = document.getElementById("wallet-error");
  errorEl.hidden = true;
  errorEl.textContent = "";
  list.querySelectorAll("[data-wallet]").forEach((button) => {
    button.addEventListener("click", () => handleConnect(button.dataset.wallet));
  });
}

async function refreshSession() {
  state.session = await api("/api/session");
}

function renderHome() {
  const address = state.session.address || "";
  content.innerHTML = `
    <div class="actions">
      <button class="btn-blue" data-core="Deposit" type="button">${ICO.plus} Deposit <span class="key">D</span></button>
      <button class="pill" data-core="Send" type="button">${ICO.send} Send <span class="key">S</span></button>
      <button class="pill" id="home-agents" type="button">${ICO.spark} Agents <span class="key">A</span></button>
    </div>
    <section class="home-panel">
      <h2>Squid Wallet</h2>
      <p class="muted home-sub">Your embedded Squid wallet is created automatically with email login.</p>
      <div class="wallet-tiles">
        <article class="wallet-tile">
          <div class="label">Balance</div>
          <div class="tile-value">$0.00</div>
        </article>
        <article class="wallet-tile">
          <div class="label">Wallet address</div>
          <div class="tile-value">${escapeHtml(shortWallet(address))}</div>
        </article>
        <article class="wallet-tile">
          <div class="label">USDC</div>
          <div class="tile-value">0 USDC</div>
        </article>
        <article class="wallet-tile">
          <div class="label">SOL</div>
          <div class="tile-value">0 SOL</div>
        </article>
      </div>
      <div class="actions home-wallet-actions">
        <button class="btn-blue" data-core="Deposit" type="button">${ICO.plus} Deposit</button>
        <button class="pill" data-core="Refresh" type="button">${ICO.refresh} Refresh</button>
        <button class="pill" id="copy-address" type="button">${ICO.copy} Copy address</button>
      </div>
      <p class="muted home-note">Funds sent to this Solana address appear after a refresh. Squid never holds your private key.</p>
    </section>
    <section class="home-panel">
      <h2>Wallets</h2>
      <p class="muted home-sub">Balances across your Squid wallet and connected wallets.</p>
      <div class="linked-wallet">
        <span class="sol-mark" aria-hidden="true">S</span>
        <div class="linked-copy">
          <div class="linked-name">Solana</div>
          <div class="mono">${escapeHtml(address)} · Squid</div>
        </div>
        <div class="linked-right">
          <div>$0.00</div>
          <div class="muted">Connected</div>
        </div>
      </div>
    </section>
  `;
  content.querySelectorAll("[data-core]").forEach((button) => {
    button.onclick = () =>
      openCoreModal(button.dataset.core, `${button.dataset.core} is full-platform. Core only talks through Squid AI.`);
  });
  document.getElementById("home-agents").onclick = openCreateAgent;
  document.getElementById("copy-address").onclick = async (event) => {
    const button = event.currentTarget;
    const original = button.innerHTML;
    try {
      await navigator.clipboard.writeText(address);
      button.textContent = "Copied";
      setTimeout(() => {
        button.innerHTML = original;
      }, 1400);
    } catch {
      openCoreModal("Copy address", "Copy the address on the full platform if this browser blocks the clipboard.");
    }
  };
}

function openCreateAgent() {
  modal.hidden = false;
  modalBackdrop.hidden = false;
  modal.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h2>Create agent</h2>
      <button class="icon-btn" id="modal-x" type="button">×</button>
    </div>
    <p class="muted">Name your agent, set an optional spending limit, then pick the framework to connect.</p>
    <div class="field">
      <label>Agent name</label>
      <input placeholder="e.g. Ops agent" disabled />
    </div>
    <div class="field">
      <label>Spending limit per payment (USD)</label>
      <input placeholder="No limit" disabled />
    </div>
    <div class="field">
      <label>Framework</label>
      <select disabled><option>Custom</option></select>
    </div>
    <div class="field">
      <label>Linked wallet</label>
      <select disabled><option>Proposal-only — link later</option></select>
    </div>
    <p class="muted">This is a public wallet association only. The agent cannot access private keys or sign.</p>
    <div class="banner">Core variant</div>
    <p>Creating agents is not included in Core. Only Squid AI / Chat works here.</p>
    <div class="modal-actions">
      <button class="pill" id="modal-cancel" type="button">Cancel</button>
      <a class="btn-blue" href="${FULL}" target="_blank" rel="noreferrer">Create agent</a>
    </div>
  `;
  document.getElementById("modal-cancel").onclick = closeModal;
  document.getElementById("modal-x").onclick = closeModal;
}

function renderChat() {
  const bubbles = state.chat
    .map((msg) => `<div class="bubble ${msg.role}">${escapeHtml(msg.content)}</div>`)
    .join("");
  content.innerHTML = `
    <section class="chat">
      <div class="chat-head">Squid AI · talk only on Core</div>
      <div class="prompts">
        <button class="prompt" data-prompt="What can Core do?" type="button">What can Core do?</button>
        <button class="prompt" data-prompt="Which wallet is connected?" type="button">Which wallet is connected?</button>
        <button class="prompt" data-prompt="Create an agent and send a payment." type="button">Agents and payments</button>
      </div>
      <div class="thread" id="thread">${bubbles}</div>
      <form class="composer" id="chat-form">
        <input name="message" placeholder="Talk to Squid AI…" autocomplete="off" />
        <button class="btn-blue" type="submit">Send</button>
      </form>
    </section>
  `;
  const thread = document.getElementById("thread");
  thread.scrollTop = thread.scrollHeight;
  document.getElementById("chat-form").addEventListener("submit", onChatSubmit);
  content.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => sendChat(button.dataset.prompt));
  });
}

async function onChatSubmit(event) {
  event.preventDefault();
  const input = event.target.elements.message;
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  await sendChat(text);
}

async function sendChat(text) {
  state.chat.push({ role: "user", content: text });
  renderChat();
  try {
    const result = await api("/api/ai/chat", {
      method: "POST",
      body: { messages: state.chat }
    });
    state.chat.push(result.message);
  } catch (error) {
    state.chat.push({ role: "assistant", content: error.message });
  }
  renderChat();
}

function corePage(title, extraHtml) {
  content.innerHTML = `
    <div class="banner">Core variant</div>
    <h2 style="margin:0 0 8px;letter-spacing:-0.03em">${escapeHtml(title)}</h2>
    <p class="muted">This is a Squid Pay Core variant. Only Squid AI / Chat works here. ${escapeHtml(title)} lives on the full console.</p>
    <div class="actions">
      <a class="btn-blue" href="${FULL}" target="_blank" rel="noreferrer">Open Squid Pay</a>
      <a class="pill" href="#/chat">Talk to Squid AI</a>
    </div>
    ${extraHtml || ""}
  `;
}

function renderMoney() {
  corePage(
    "Money",
    `
    <section class="stats">
      <article class="card"><div class="label">Available</div><div class="metric">$0.00</div></article>
      <article class="card"><div class="label">Daily money</div><p class="muted">Pay people or services</p></article>
      <article class="card"><div class="label">Verified payments</div><div class="metric">0</div></article>
    </section>
  `
  );
}

function renderHolds() {
  corePage(
    "Needs Review",
    `<section class="card activity-empty"><div><h3>No holds</h3><p class="muted">Review queues run on squidpay.dev.</p></div></section>`
  );
}

function renderAgents() {
  corePage(
    "Agents",
    `<section class="card activity-empty"><div><h3>No agents</h3><p class="muted">Create agents on the full platform.</p></div></section>`
  );
}

function renderActivity() {
  const cells = Array.from({ length: 7 * 24 }, (_, i) => `<span class="heat-cell${i === 110 || i === 163 ? " on" : ""}"></span>`).join("");
  corePage(
    "Activity",
    `
    <h3>Trade intensity</h3>
    <p class="muted">When and where the most activity happens</p>
    <section class="stats">
      <article class="card"><div class="label">Busiest when</div><div class="metric" style="font-size:20px">—</div></article>
      <article class="card"><div class="label">Busiest where</div><div class="metric" style="font-size:20px">Chat</div></article>
      <article class="card"><div class="label">Logged events</div><div class="metric">0</div></article>
    </section>
    <section class="card heat">
      <div class="muted">When</div>
      <div class="heat-grid">${cells}</div>
      <div class="bars">
        <div class="bar"><span>Trading</span><i></i><span>0</span></div>
        <div class="bar"><span>Payments</span><i></i><span>0</span></div>
        <div class="bar"><span>Agents</span><i><em style="width:0"></em></i><span>0</span></div>
      </div>
    </section>
    <section class="card" style="margin-top:12px">
      <h3>Activity log</h3>
      <table class="table">
        <thead><tr><th>Area</th><th>Time</th><th>From</th><th>Action</th><th>Outcome</th><th>Why</th></tr></thead>
        <tbody><tr><td colspan="6" class="muted">Nothing here yet.</td></tr></tbody>
      </table>
    </section>
  `
  );
}

function renderCli() {
  const session = {
    authenticated: true,
    variant: "core",
    access: "Owner session",
    wallet: {
      provider: state.session.provider,
      address: state.session.address
    },
    safety: "Read and talk only. Wallet signing and money stay on squidpay.dev."
  };
  corePage(
    "Squid CLI",
    `
    <section class="cli">
      <aside class="cli-side">
        <div class="kicker">Native Squid</div>
        <h3>Platform CLI</h3>
        <p class="muted">Read your workspace and create proposals for review. Commands run through Squid.</p>
        <p class="muted">Human control stays on. The CLI cannot approve holds, sign transactions, or move money on Core.</p>
      </aside>
      <div class="cli-main">
        <div class="cli-cmd">squid@platform · squid status</div>
        <pre>${escapeHtml(JSON.stringify(session, null, 2))}</pre>
      </div>
    </section>
  `
  );
}

function renderSettings() {
  corePage("Settings", `<section class="card"><p class="muted">Workspace, keys, and safety controls are on the full platform.</p></section>`);
}

function renderHelp() {
  corePage("Help", `<section class="card"><p class="muted">Docs for the full console are at squidpay.dev.</p></section>`);
}

async function handleConnect(id) {
  const errorEl = document.getElementById("wallet-error");
  errorEl.hidden = true;
  try {
    state.session = await connectBrowserWallet(id);
    if (location.hash !== "#/home") location.hash = "#/home";
    else await showPlatform("home");
  } catch (error) {
    errorEl.hidden = false;
    errorEl.innerHTML = error.install
      ? `${escapeHtml(error.message)} <a href="${error.install}" target="_blank" rel="noreferrer">Install →</a>`
      : escapeHtml(error.message);
  }
}

async function handleDisconnect() {
  state.session = await api("/api/session/disconnect", { method: "POST", body: {} });
  if (location.hash !== "#/connect") location.hash = "#/connect";
  renderConnectGate();
}

async function showPlatform(route) {
  const next = route === "wallet" || route === "connect" ? "home" : route || "home";
  state.route = next === "ai" ? "chat" : next;
  setShell(true);
  setChrome();
  closeMenu();
  if (state.route === "home") return renderHome();
  if (state.route === "chat") return renderChat();
  if (state.route === "money") return renderMoney();
  if (state.route === "holds") return renderHolds();
  if (state.route === "agents") return renderAgents();
  if (state.route === "activity") return renderActivity();
  if (state.route === "cli") return renderCli();
  if (state.route === "settings") return renderSettings();
  if (state.route === "help") return renderHelp();
  const payload = await api(`/api/platform/${encodeURIComponent(state.route)}`);
  corePage(payload.title || "Full platform");
}

async function renderRoute(route) {
  if (!isConnected()) {
    renderConnectGate();
    return;
  }
  await showPlatform(route);
}

function currentRoute() {
  const raw = (location.hash || "#/home").replace(/^#\/?/, "").split("?")[0];
  return raw || "home";
}

document.getElementById("disconnect-btn").addEventListener("click", handleDisconnect);
document.getElementById("menu-btn").addEventListener("click", openMenu);
document.getElementById("choose-agent").addEventListener("click", () => {
  openCoreModal("Choose agent", "Agent switching is full-platform. Core only talks through Squid AI.");
});
backdrop.addEventListener("click", closeMenu);
modalBackdrop.addEventListener("click", closeModal);
window.addEventListener("hashchange", () => renderRoute(currentRoute()));

refreshSession()
  .catch(() => {})
  .finally(() => renderRoute(currentRoute()));

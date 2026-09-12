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
      provider: "metamask",
      address: "0x8a3fc41d708d33aabb",
      chain: "evm"
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

function setChrome() {
  if (!isConnected()) return;
  document.getElementById("wallet-chip").textContent =
    `${state.session.provider} · ${shortAddress(state.session.address)}`;
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
  const session = state.session;
  content.innerHTML = `
    <div class="actions">
      <button class="pill" data-core="Deposit" type="button">Deposit <span class="key">D</span></button>
      <button class="pill" data-core="Send" type="button">Send <span class="key">S</span></button>
      <button class="pill" id="connect-agent" type="button">Connect agent <span class="key">A</span></button>
    </div>
    <section class="stats">
      <article class="card">
        <div class="label">Wallets</div>
        <p class="muted">Balances across your Squid session</p>
        <div class="wallet-row">
          <span class="wallet-dot">${escapeHtml((session.provider || "?").slice(0, 1).toUpperCase())}</span>
          <div>
            <div>${escapeHtml(session.provider || "wallet")}</div>
            <div class="mono">${escapeHtml(shortAddress(session.address))}</div>
          </div>
          <div style="margin-left:auto">$0.00</div>
        </div>
      </article>
      <article class="card">
        <div class="label">Available</div>
        <div class="metric">$0.00</div>
      </article>
      <article class="card">
        <div class="label">Planned payments</div>
        <div class="metric">$0.00</div>
      </article>
      <article class="card">
        <div class="label">Daily money</div>
        <p class="muted">Pay people or services with Core talk only</p>
      </article>
      <article class="card">
        <div class="label">Verified payments</div>
        <div class="metric">0</div>
      </article>
      <article class="card">
        <div class="label">Needs review</div>
        <div class="metric">0</div>
      </article>
    </section>
    <section class="card activity-empty">
      <div>
        <h3>Recent activity</h3>
        <p class="muted">Nothing here yet. Records show up after activity on the full platform.</p>
      </div>
    </section>
  `;
  content.querySelectorAll("[data-core]").forEach((button) => {
    button.onclick = () =>
      openCoreModal(button.dataset.core, `${button.dataset.core} is full-platform. Core only talks through Squid AI.`);
  });
  document.getElementById("connect-agent").onclick = openCreateAgent;
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

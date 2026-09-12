const coreWallets = window.SquidCoreWallets;
const WALLET_CATALOG = coreWallets.WALLET_META;
const detectInstalledWallets = coreWallets.detectWallets;
const connectBrowserWallet = coreWallets.connectWallet;
const api = coreWallets.api;

const CORE_ROUTES = {
  home: { title: "Home", eyebrow: "Squid Pay Core" },
  ai: { title: "Squid AI", eyebrow: "Core" }
};

const state = {
  session: { connected: false },
  route: "home",
  chat: [
    {
      role: "assistant",
      content:
        "I am Squid AI on Core. Your wallet is already connected for this session. Ask about Core, or I will send full-platform work to squidpay.dev."
    }
  ]
};

const content = document.getElementById("content");
const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("drawer-backdrop");
const appShell = document.getElementById("app-shell");
const connectGate = document.getElementById("connect-gate");

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

function isConnected() {
  return Boolean(state.session?.connected && state.session.address);
}

function setShell(connected) {
  document.body.classList.toggle("on-gate", !connected);
  appShell.hidden = !connected;
  connectGate.hidden = connected;
}

function setChrome() {
  if (!isConnected()) return;
  const meta = CORE_ROUTES[state.route] || { title: "Full platform", eyebrow: "Core variant" };
  document.getElementById("top-title").textContent = meta.title;
  document.getElementById("top-eyebrow").textContent = meta.eyebrow;
  document.getElementById("wallet-chip").textContent =
    `${state.session.provider} · ${shortAddress(state.session.address)}`;
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.route === state.route);
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
    <section class="hero">
      <div>
        <h2>Dive into the future of the <em>economy.</em></h2>
        <p class="lede">You are in Squid Pay Core. Squid AI can talk about this wallet session. Payments, cards, agents, and the rest of the console stay on the full platform.</p>
        <div class="actions">
          <a class="btn" href="#/ai">Talk to Squid AI →</a>
          <a class="ghost" href="https://squidpay.dev" target="_blank" rel="noreferrer">Open squidpay.dev</a>
        </div>
      </div>
      <div class="card-visual">
        <div class="row">
          <span>${escapeHtml(session.provider)}</span>
          <span>${escapeHtml(shortAddress(session.address))}</span>
        </div>
        <div>
          <div class="amt">Connected</div>
          <div class="chip">${escapeHtml(session.chain)}</div>
        </div>
      </div>
    </section>
    <section class="grid">
      <article class="panel">
        <p class="kicker">session</p>
        <h3>Wallet is the door</h3>
        <p>Core only uses MetaMask, Coinbase Wallet, Phantom, or Backpack to let you in. Disconnect to leave the platform.</p>
      </article>
      <article class="panel">
        <p class="kicker">included</p>
        <h3>Squid AI</h3>
        <p>Ask about this session, Core limits, and where the full product lives.</p>
      </article>
      <article class="panel">
        <p class="kicker">squidpay.dev</p>
        <h3>Everything else</h3>
        <p>Payments, cards, trading, agents, holds, links, policies, catalog, and developer keys stay on the main platform.</p>
      </article>
    </section>
  `;
}

async function handleConnect(id) {
  const errorEl = document.getElementById("wallet-error");
  errorEl.hidden = true;
  try {
    state.session = await connectBrowserWallet(id);
    if (location.hash !== "#/home") location.hash = "#/home";
    else await showPlatform(currentRoute());
  } catch (error) {
    errorEl.hidden = false;
    errorEl.innerHTML = error.install
      ? `${escapeHtml(error.message)} <a class="text-link" href="${error.install}" target="_blank" rel="noreferrer">Install →</a>`
      : escapeHtml(error.message);
  }
}

async function handleDisconnect() {
  state.session = await api("/api/session/disconnect", { method: "POST", body: {} });
  if (location.hash && location.hash !== "#/connect") location.hash = "#/connect";
  renderConnectGate();
}

function renderAi() {
  const bubbles = state.chat
    .map((msg) => `<div class="bubble ${msg.role}">${escapeHtml(msg.content)}</div>`)
    .join("");
  content.innerHTML = `
    <div class="prompts">
      <button class="prompt" data-prompt="What can Core do?" type="button">What can Core do?</button>
      <button class="prompt" data-prompt="Which wallet is connected?" type="button">Which wallet is connected?</button>
      <button class="prompt" data-prompt="I need to send a payment and issue an agent card." type="button">Payments and cards</button>
    </div>
    <section class="chat">
      <div class="thread" id="thread">${bubbles}</div>
      <form class="composer" id="chat-form">
        <input name="message" placeholder="Ask Squid AI…" autocomplete="off" />
        <button class="btn" type="submit">Send</button>
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
  renderAi();
  try {
    const result = await api("/api/ai/chat", {
      method: "POST",
      body: { messages: state.chat }
    });
    state.chat.push(result.message);
  } catch (error) {
    state.chat.push({ role: "assistant", content: error.message });
  }
  renderAi();
}

function renderGate(payload) {
  content.innerHTML = `
    <section class="gate">
      <div class="banner">Core variant</div>
      <h2>${escapeHtml(payload.title)}</h2>
      <p class="kicker">${escapeHtml(payload.api)}</p>
      <p class="lede">${escapeHtml(payload.summary)}</p>
      <p>${escapeHtml(payload.message)}</p>
      <div class="actions">
        <a class="btn-blue" href="${payload.cta.url}" target="_blank" rel="noreferrer">${escapeHtml(payload.cta.label)} →</a>
        <a class="ghost" href="#/ai">Ask Squid AI</a>
      </div>
    </section>
  `;
}

async function showPlatform(route) {
  const next = route === "wallet" || route === "connect" ? "home" : route || "home";
  state.route = next;
  setShell(true);
  setChrome();
  closeMenu();
  if (next === "home") return renderHome();
  if (next === "ai") return renderAi();
  const payload = await api(`/api/platform/${encodeURIComponent(next)}`);
  document.getElementById("top-title").textContent = payload.title || "Full platform";
  renderGate(payload);
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
backdrop.addEventListener("click", closeMenu);
window.addEventListener("hashchange", () => renderRoute(currentRoute()));

refreshSession()
  .catch(() => {})
  .finally(() => renderRoute(currentRoute()));

const { WALLET_META, detectWallets, connectWallet, api } = window.SquidCoreWallets;

const CORE_ROUTES = {
  home: { title: "Home", eyebrow: "Squid Pay Core" },
  wallet: { title: "Wallet", eyebrow: "Core" },
  ai: { title: "Squid AI", eyebrow: "Core" }
};

const state = {
  session: { connected: false },
  route: "home",
  chat: [
    {
      role: "assistant",
      content:
        "I am Squid AI on Core. Connect MetaMask, Coinbase Wallet, Phantom, or Backpack, then ask about that session. Everything else lives on squidpay.dev."
    }
  ]
};

const content = document.getElementById("content");
const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("drawer-backdrop");

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

function setChrome() {
  const meta = CORE_ROUTES[state.route] || { title: "Full platform", eyebrow: "Core variant" };
  document.getElementById("top-title").textContent = meta.title;
  document.getElementById("top-eyebrow").textContent = meta.eyebrow;
  document.getElementById("wallet-chip").textContent = state.session.connected
    ? `${state.session.provider} · ${shortAddress(state.session.address)}`
    : "Connect wallet";
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

async function refreshSession() {
  state.session = await api("/api/session");
  setChrome();
}

function renderHome() {
  const session = state.session;
  content.innerHTML = `
    <section class="hero">
      <div>
        <h2>Dive into the future of the <em>economy.</em></h2>
        <p class="lede">Every AI agent needs a bank. This Core variant keeps the simple path: connect a wallet and talk to Squid AI. The rest of the Squid Pay console is on the full platform.</p>
        <div class="actions">
          <a class="btn" href="#/wallet">${session.connected ? "Open wallet" : "Connect wallet"} →</a>
          <a class="ghost" href="#/ai">Talk to Squid AI</a>
        </div>
      </div>
      <div class="card-visual">
        <div class="row">
          <span>${session.connected ? escapeHtml(session.provider) : "squid"}</span>
          <span>${session.connected ? escapeHtml(shortAddress(session.address)) : "Core session"}</span>
        </div>
        <div>
          <div class="amt">${session.connected ? "Connected" : "Open core"}</div>
          <div class="chip">${session.connected ? session.chain : "MetaMask · Coinbase · Phantom · Backpack"}</div>
        </div>
      </div>
    </section>
    <section class="grid">
      <article class="panel">
        <p class="kicker">included</p>
        <h3>Wallet connect</h3>
        <p>Prove you own MetaMask, Coinbase Wallet, Phantom, or Backpack. Core never holds a seed phrase.</p>
      </article>
      <article class="panel">
        <p class="kicker">included</p>
        <h3>Squid AI</h3>
        <p>Ask about your session, Core limits, and where the full product lives.</p>
      </article>
      <article class="panel">
        <p class="kicker">squidpay.dev</p>
        <h3>Everything else</h3>
        <p>Payments, cards, trading, agents, holds, links, policies, catalog, and developer keys stay on the main platform.</p>
      </article>
    </section>
  `;
}

function renderWallet() {
  const detected = detectWallets();
  const cards = Object.values(WALLET_META)
    .map((wallet) => {
      const live = detected[wallet.id];
      const active = state.session.connected && state.session.provider === wallet.id;
      const status = live.installed ? "Detected in this browser" : "Install to connect";
      return `
        <button class="wallet-card ${live.installed ? "ready" : ""} ${active ? "active" : ""}" data-wallet="${wallet.id}" type="button">
          <span class="wallet-mark" style="background:${wallet.color}">${wallet.mark}</span>
          <span>
            <h3>${wallet.name}</h3>
            <p>${wallet.family === "evm" ? "EVM" : "Solana"} · ${status}</p>
          </span>
        </button>
      `;
    })
    .join("");

  const session = state.session.connected
    ? `
      <div class="session-box">
        <div>
          <div class="chip ok">Connected</div>
          <h3 style="margin:8px 0 6px">${escapeHtml(state.session.provider)}</h3>
          <div class="mono">${escapeHtml(state.session.address)}</div>
          <p class="muted" style="color:#9ca3af">Chain ${escapeHtml(state.session.chain)}</p>
        </div>
        <button class="ghost" id="disconnect-btn" type="button">Disconnect</button>
      </div>
    `
    : `<p class="muted">Choose a wallet. Core asks it to sign a session message. No funds move.</p>`;

  content.innerHTML = `
    <section class="grid two" style="align-items:start">
      <div>
        <div class="wallet-grid">${cards}</div>
        <p class="error" id="wallet-error" hidden></p>
      </div>
      <div class="panel">
        <p class="kicker">session</p>
        <h3>Owner wallet stays the signer</h3>
        ${session}
      </div>
    </section>
  `;

  content.querySelectorAll("[data-wallet]").forEach((button) => {
    button.addEventListener("click", () => handleConnect(button.dataset.wallet));
  });
  document.getElementById("disconnect-btn")?.addEventListener("click", handleDisconnect);
}

async function handleConnect(id) {
  const errorEl = document.getElementById("wallet-error");
  errorEl.hidden = true;
  try {
    state.session = await connectWallet(id);
    renderWallet();
    setChrome();
  } catch (error) {
    errorEl.hidden = false;
    errorEl.innerHTML = error.install
      ? `${escapeHtml(error.message)} <a class="text-link" href="${error.install}" target="_blank" rel="noreferrer">Install →</a>`
      : escapeHtml(error.message);
  }
}

async function handleDisconnect() {
  state.session = await api("/api/session/disconnect", { method: "POST", body: {} });
  renderWallet();
  setChrome();
}

function renderAi() {
  const bubbles = state.chat
    .map((msg) => `<div class="bubble ${msg.role}">${escapeHtml(msg.content)}</div>`)
    .join("");
  content.innerHTML = `
    <div class="prompts">
      <button class="prompt" data-prompt="What can Core do?" type="button">What can Core do?</button>
      <button class="prompt" data-prompt="How do I connect Phantom or MetaMask?" type="button">Connect a wallet</button>
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

async function renderRoute(route) {
  state.route = route;
  setChrome();
  closeMenu();
  if (route === "home") return renderHome();
  if (route === "wallet") return renderWallet();
  if (route === "ai") return renderAi();
  const payload = await api(`/api/platform/${encodeURIComponent(route)}`);
  document.getElementById("top-title").textContent = payload.title || "Full platform";
  renderGate(payload);
}

function currentRoute() {
  const raw = (location.hash || "#/home").replace(/^#\/?/, "").split("?")[0];
  return raw || "home";
}

document.getElementById("wallet-chip").addEventListener("click", () => {
  location.hash = "#/wallet";
});
document.getElementById("menu-btn").addEventListener("click", openMenu);
backdrop.addEventListener("click", closeMenu);
window.addEventListener("hashchange", () => renderRoute(currentRoute()));

refreshSession()
  .catch(() => {})
  .finally(() => renderRoute(currentRoute()));

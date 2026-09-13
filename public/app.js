const coreWallets = window.SquidCoreWallets;
const WALLET_CATALOG = coreWallets.WALLET_META;
const detectInstalledWallets = coreWallets.detectWallets;
const connectBrowserWallet = coreWallets.connectWallet;
const api = coreWallets.api;
const FULL = "https://squidpay.dev";

const state = {
  session: { connected: false },
  route: "home",
  cliLog: [],
  cliTutorial: { open: true, step: 0 },
  chat: [],
  activity: []
};

const content = document.getElementById("content");
const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("drawer-backdrop");
const appShell = document.getElementById("app-shell");
const connectGate = document.getElementById("connect-gate");
const modal = document.getElementById("modal");
const modalCard = document.getElementById("modal-card");
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
      address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      chain: "solana"
    };
  }
  return Boolean(state.session?.connected && state.session.address);
}

function applyTheme() {
  const theme = localStorage.getItem("squid-theme");
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function cycleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : current === "light" ? "" : "dark";
  if (next) localStorage.setItem("squid-theme", next);
  else localStorage.removeItem("squid-theme");
  applyTheme();
}

function setShell(connected) {
  document.body.classList.toggle("wallet-gate-active", !connected);
  document.body.classList.toggle("chat-page", connected && (state.route === "chat" || state.route === "ai"));
  document.body.classList.toggle("cli-page", connected && state.route === "cli");
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
  const onChat = state.route === "chat" || state.route === "ai";
  document.getElementById("top-balance").textContent = onChat ? "ops" : "$0.00";
  document.getElementById("wallet-chip").textContent = onChat ? "0 USDC" : `Signed in with ${provider}.`;
  document.querySelectorAll(".nav-button").forEach((item) => {
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
  modalCard.innerHTML = "";
}

function openCoreModal(title, copy) {
  modal.hidden = false;
  modalCard.innerHTML = `
    <div class="app-modal-head">
      <div>
        <p class="eyebrow">Core variant</p>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <button class="panel-close" id="modal-x" type="button">×</button>
    </div>
    <div class="app-modal-body">
      <p>${escapeHtml(copy)}</p>
      <p>This is a Squid Pay Core variant. Only Squid AI / Chat works here. Open the full console for this action.</p>
    </div>
    <div class="app-modal-actions">
      <button id="modal-cancel" type="button">Cancel</button>
      <a href="${FULL}" target="_blank" rel="noreferrer"><button class="primary" type="button">Open Squid Pay</button></a>
    </div>
  `;
  document.getElementById("modal-cancel").onclick = closeModal;
  document.getElementById("modal-x").onclick = closeModal;
}

function walletCardsHtml() {
  const detected = detectInstalledWallets();
  const chrome = {
    metamask: { id: "metamask-connect", cls: "", icon: '<span class="metamask-connect-icon">M</span>' },
    coinbase: { id: "coinbase-connect", cls: "", icon: '<span class="coinbase-connect-icon">C</span>' },
    phantom: { id: "phantom-connect", cls: "phantom-connect", icon: '<span class="phantom-connect-icon">P</span>' },
    backpack: { id: "backpack-connect", cls: "", icon: '<span class="backpack-connect-icon">B</span>' }
  };
  return Object.values(WALLET_CATALOG)
    .map((wallet) => {
      const live = detected[wallet.id];
      const look = chrome[wallet.id] || { id: wallet.id, cls: "", icon: wallet.mark };
      const status = live.installed ? "Detected in this browser" : "Install to connect";
      return `
        <button class="${look.cls}" id="${look.id}" data-wallet="${wallet.id}" type="button">
          ${look.icon}
          <span>${wallet.name} · ${status}</span>
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
    <div class="view">
      <div class="action-bar">
        <button class="action-chip primary" data-core="Deposit" type="button">${ICO.plus} Deposit <kbd>D</kbd></button>
        <button class="action-chip" data-core="Send" type="button">${ICO.send} Send <kbd>S</kbd></button>
        <button class="action-chip" id="home-agents" type="button">${ICO.spark} Agents <kbd>A</kbd></button>
      </div>
      <section class="band squid-wallet-card">
        <div class="section-head">
          <div>
            <h2>Squid Wallet</h2>
            <p>Your embedded Squid wallet is created automatically with email login.</p>
          </div>
        </div>
        <div class="grid two">
          <article class="metric"><span>Balance</span><strong>$0.00</strong></article>
          <article class="metric"><span>Wallet address</span><strong>${escapeHtml(shortWallet(address))}</strong></article>
          <article class="metric"><span>USDC</span><strong>0 USDC</strong></article>
          <article class="metric"><span>SOL</span><strong>0 SOL</strong></article>
        </div>
        <p class="deposit-warning">Funds sent to this Solana address appear after a refresh. Squid never holds your private key.</p>
      </section>
      <section class="band">
        <div class="section-head">
          <div>
            <h2>Wallets</h2>
            <p>Balances across your Squid wallet and connected wallets.</p>
          </div>
        </div>
        <div class="asset-list">
          <div class="asset-row">
            <span class="asset-icon chain-solana">S</span>
            <div class="asset-main">
              <strong>Solana</strong>
              <span>${escapeHtml(address)} · Squid</span>
            </div>
            <div class="asset-value">$0.00<span>Connected</span></div>
          </div>
        </div>
      </section>
    </div>
  `;
  content.querySelectorAll("[data-core]").forEach((button) => {
    button.onclick = () =>
      openCoreModal(button.dataset.core, `${button.dataset.core} is full-platform. Core only talks through Squid AI.`);
  });
  document.getElementById("home-agents").onclick = openCreateAgent;
}

function openCreateAgent() {
  modal.hidden = false;
  modalCard.innerHTML = `
    <div class="app-modal-head">
      <div>
        <p class="eyebrow">Core variant</p>
        <h2>Create agent</h2>
      </div>
      <button class="panel-close" id="modal-x" type="button">×</button>
    </div>
    <div class="app-modal-body">
      <p>Name your agent, set an optional spending limit, then pick the framework to connect.</p>
      <label>Agent name<input placeholder="e.g. Ops agent" disabled /></label>
      <label>Spending limit per payment (USD)<input placeholder="No limit" disabled /></label>
      <label>Framework<select disabled><option>Custom</option></select></label>
      <label>Linked wallet<select disabled><option>Proposal-only — link later</option></select></label>
      <p>This is a public wallet association only. The agent cannot access private keys or sign. Creating agents is not included in Core.</p>
    </div>
    <div class="app-modal-actions">
      <button id="modal-cancel" type="button">Cancel</button>
      <a href="${FULL}" target="_blank" rel="noreferrer"><button class="primary" type="button">Create agent</button></a>
    </div>
  `;
  document.getElementById("modal-cancel").onclick = closeModal;
  document.getElementById("modal-x").onclick = closeModal;
}

const CHAT_EXAMPLES = [
  { title: "Portfolio scan", detail: "See all your balances at a glance.", prompt: "Scan my portfolio and summarize all balances." },
  { title: "Swap", detail: "Swap via Jupiter (Solana) or 0x (EVM).", prompt: "Prepare a swap via Jupiter or 0x." },
  { title: "Open perp position", detail: "Trade perpetual futures.", prompt: "Prepare an open perp position draft." },
  { title: "Add to OpenClaw", detail: "Use your agent in other clients.", prompt: "Add this ops agent to OpenClaw." },
  { title: "Create automation", detail: "Draft a daily cron in Automations.", prompt: "Draft a daily automation." },
  { title: "Create token", detail: "Deploy an ERC-20 on Base.", prompt: "Prepare an ERC-20 token draft on Base." }
];

function chatWelcomeText() {
  const profile = profileFromSession();
  const hi = profile.name ? `Hi ${profile.name}` : "Hi";
  return `${hi} — I'm Squid, your single Chat assistant while ops is active. AI actions are off, but you can still prepare a payment, trade, automation, or token draft here. You can also drag and drop images here.`;
}

function renderChat() {
  const hasUser = state.chat.some((msg) => msg.role === "user");
  const bubbles = state.chat
    .map(
      (msg) =>
        `<div class="chat-message ${msg.role}"><strong>${msg.role === "user" ? "You" : "Squid"}</strong><p>${escapeHtml(msg.content)}</p></div>`
    )
    .join("");
  const welcome = hasUser
    ? ""
    : `
      <div class="chat-message chat-welcome" id="chat-welcome">
        <strong>Squid</strong>
        <p id="chat-welcome-text">${escapeHtml(chatWelcomeText())}</p>
      </div>
    `;
  const examples = hasUser
    ? ""
    : `
      <div class="chat-examples">
        <div class="chat-examples-head">
          <p class="eyebrow">Example actions</p>
          <h3>What can ops do?</h3>
          <p>Pick an action, tweak the prompt if needed, then hit send.</p>
        </div>
        <div class="chat-examples-grid">
          ${CHAT_EXAMPLES.map(
            (item) =>
              `<button class="chat-example-card" data-prompt="${escapeHtml(item.prompt)}" type="button"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></button>`
          ).join("")}
        </div>
        <ol class="chat-examples-steps">
          <li><span>1</span> Choose an action</li>
          <li><span>2</span> Review the prompt</li>
          <li><span>3</span> Press send</li>
        </ol>
      </div>
    `;
  content.innerHTML = `
    <section class="chat-panel" id="chat-panel">
      <div class="chat-dropzone" id="chat-dropzone">
        <strong>Drop an image</strong>
        <span>Image drafts stay on the full platform.</span>
      </div>
      <div class="chat-thread" id="thread">${welcome}${examples}${bubbles}</div>
      <form class="chat-composer" id="chat-form">
        <button class="chat-attach" id="chat-attach" type="button" aria-label="Attach">+</button>
        <input name="message" id="chat-input" placeholder="Prepare a payment, trade, automation, or token" autocomplete="off" />
        <button class="primary chat-send" type="submit" aria-label="Send">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.2 8h9.4M9.2 4.6 12.8 8 9.2 11.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </form>
    </section>
  `;
  const thread = document.getElementById("thread");
  thread.scrollTop = thread.scrollHeight;
  const input = document.getElementById("chat-input");
  document.getElementById("chat-form").addEventListener("submit", onChatSubmit);
  document.getElementById("chat-attach").onclick = () =>
    openCoreModal("Attach image", "Image attach is full-platform. Core only talks through Squid AI.");
  const panel = document.getElementById("chat-panel");
  ["dragenter", "dragover"].forEach((type) => {
    panel.addEventListener(type, (event) => {
      event.preventDefault();
      panel.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((type) => {
    panel.addEventListener(type, (event) => {
      event.preventDefault();
      panel.classList.remove("is-dragging");
      if (type === "drop") {
        openCoreModal("Attach image", "Image attach is full-platform. Core only talks through Squid AI.");
      }
    });
  });
  content.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      content.querySelectorAll(".chat-example-card").forEach((card) => card.classList.remove("selected"));
      button.classList.add("selected");
      input.value = button.dataset.prompt;
      input.focus();
    });
  });
  requestAnimationFrame(() => document.getElementById("chat-welcome")?.classList.add("is-visible"));
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
    <div class="view">
      <section class="band">
        <p class="notice visible">Core variant</p>
        <div class="section-head">
          <div>
            <h2>${escapeHtml(title)}</h2>
            <p>This is a Squid Pay Core variant. Only Squid AI / Chat works here. ${escapeHtml(title)} lives on the full console.</p>
          </div>
        </div>
        <div class="actions">
          <a href="${FULL}" target="_blank" rel="noreferrer"><button class="primary" type="button">Open Squid Pay</button></a>
          <a href="#/chat"><button type="button">Talk to Squid AI</button></a>
        </div>
      </section>
      ${extraHtml || ""}
    </div>
  `;
}

function renderMoney() {
  corePage(
    "Money",
    `
    <div class="grid">
      <article class="metric"><span>Available</span><strong>$0.00</strong></article>
      <article class="metric"><span>Daily money</span><p>Pay people or services</p></article>
      <article class="metric"><span>Verified payments</span><strong>0</strong></article>
    </div>
  `
  );
}

function renderHolds() {
  corePage("Needs Review", `<div class="empty"><strong>No holds</strong>Review queues run on squidpay.dev.</div>`);
}

function renderAgents() {
  corePage("Agents", `<div class="empty"><strong>No agents</strong>Create agents on the full platform.</div>`);
}

const ACTIVITY_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ACTIVITY_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ACTIVITY_AREAS = [
  { id: "trading", label: "Trading" },
  { id: "payments", label: "Payments" },
  { id: "approvals", label: "Approvals" },
  { id: "issuing", label: "Issuing" },
  { id: "rules", label: "Rules" },
  { id: "agents", label: "Agents" },
  { id: "billing", label: "Billing" },
  { id: "issues", label: "Issues" }
];

function activityStats() {
  const heat = ACTIVITY_DAYS.map(() => Array(24).fill(0));
  const where = Object.fromEntries(ACTIVITY_AREAS.map((area) => [area.id, 0]));
  const events = Array.isArray(state.activity) ? state.activity : [];
  events.forEach((event) => {
    const when = new Date(event.at || Date.now());
    heat[when.getDay()][when.getHours()] += 1;
    if (where[event.area] != null) where[event.area] += 1;
  });
  let peakDay = 0;
  let peakHour = 0;
  let peakCount = 0;
  heat.forEach((row, day) => {
    row.forEach((count, hour) => {
      if (count > peakCount) {
        peakCount = count;
        peakDay = day;
        peakHour = hour;
      }
    });
  });
  const topArea = ACTIVITY_AREAS.reduce(
    (best, area) => (where[area.id] > (where[best] || 0) ? area.id : best),
    ""
  );
  const topCount = topArea ? where[topArea] : 0;
  const nextHour = String((peakHour + 1) % 24).padStart(2, "0");
  return {
    events: events.length,
    heat,
    where,
    whenTitle: peakCount ? `${ACTIVITY_DAY_NAMES[peakDay]} ${String(peakHour).padStart(2, "0")}:00–${nextHour}:00` : "—",
    whenDetail: peakCount ? `${peakCount} event${peakCount === 1 ? "" : "s"} in that hour` : "No events in this view",
    whereTitle: topCount ? ACTIVITY_AREAS.find((area) => area.id === topArea).label : "—",
    whereDetail: topCount ? `${topCount} event${topCount === 1 ? "" : "s"} in ${ACTIVITY_AREAS.find((area) => area.id === topArea).label}` : "No events in this view"
  };
}

function renderHeatmap(heat) {
  const rows = ACTIVITY_DAYS.map((day, dayIndex) => {
    const cells = heat[dayIndex]
      .map((count, hour) => {
        const level = count <= 0 ? 0 : Math.min(4, count);
        return `<i class="heat-cell level-${level}" title="${day} ${String(hour).padStart(2, "0")}:00 · ${count}"></i>`;
      })
      .join("");
    return `<span class="heat-day">${day}</span>${cells}`;
  }).join("");
  return `
    <div class="heat-grid">${rows}</div>
    <div class="heat-hours">
      <span class="heat-day"></span>
      <div class="heat-hours-scale"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
    </div>
    <p class="heat-legend"><span>Less</span><i class="heat-cell"></i><i class="heat-cell level-1"></i><i class="heat-cell level-2"></i><i class="heat-cell level-3"></i><i class="heat-cell level-4"></i><span>More</span></p>
  `;
}

function renderWhereBars(where) {
  const max = Math.max(1, ...ACTIVITY_AREAS.map((area) => where[area.id] || 0));
  return ACTIVITY_AREAS.map((area) => {
    const count = where[area.id] || 0;
    return `
      <div class="where-row">
        <span>${escapeHtml(area.label)}</span>
        <span class="where-track"><i style="width:${(count / max) * 100}%"></i></span>
        <strong>${count}</strong>
      </div>
    `;
  }).join("");
}

function renderActivity() {
  const stats = activityStats();
  content.innerHTML = `
    <div class="view activity-page">
      <section class="band intensity-band">
        <div class="section-head">
          <div>
            <h2>Trade intensity</h2>
            <p>When and where the most activity happens</p>
          </div>
        </div>
        <div class="grid">
          <article class="metric"><span>Busiest when</span><strong>${escapeHtml(stats.whenTitle)}</strong><p>${escapeHtml(stats.whenDetail)}</p></article>
          <article class="metric"><span>Busiest where</span><strong>${escapeHtml(stats.whereTitle)}</strong><p>${escapeHtml(stats.whereDetail)}</p></article>
          <article class="metric"><span>Logged events</span><strong>${stats.events}</strong><p>From the Activity log in this view</p></article>
        </div>
        <div class="intensity-charts">
          <div>
            <h3>When</h3>
            <p>Day of week × hour — darker cells are busier</p>
            ${renderHeatmap(stats.heat)}
          </div>
          <div>
            <h3>Where</h3>
            <p>Which console area has the most activity</p>
            <div class="where-list">${renderWhereBars(stats.where)}</div>
          </div>
        </div>
      </section>
      <section class="band">
        <p class="notice visible">Core variant</p>
        <div class="section-head">
          <div>
            <h2>Activity</h2>
            <p>This is a Squid Pay Core variant. Only Squid AI / Chat works here. Activity lives on the full console.</p>
          </div>
        </div>
        <div class="actions">
          <a href="${FULL}" target="_blank" rel="noreferrer"><button class="primary" type="button">Open Squid Pay</button></a>
          <a href="#/chat"><button type="button">Talk to Squid AI</button></a>
        </div>
      </section>
      <section class="band">
        <div class="section-head">
          <div>
            <h3>Activity log</h3>
          </div>
          <label class="activity-filter">Show
            <select id="activity-filter">
              <option value="all" selected>all</option>
              ${ACTIVITY_AREAS.map((area) => `<option value="${escapeHtml(area.id)}">${escapeHtml(area.label)}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Area</th><th>Time</th><th>Workspace</th><th>From</th><th>Action</th><th>Outcome</th><th>Why</th></tr></thead>
            <tbody><tr><td colspan="7">Nothing here yet.</td></tr></tbody>
          </table>
        </div>
      </section>
    </div>
  `;
  document.getElementById("activity-filter").onchange = () =>
    openCoreModal("Activity filter", "The full activity log lives on squidpay.dev. Core only talks through Squid AI.");
}

const CLI_COMMANDS = [
  { label: "Status", command: "squid status" },
  { label: "Session", command: "squid session" },
  { label: "Agents", command: "squid agents" },
  { label: "Holds", command: "squid holds" },
  { label: "Help", command: "squid help" }
];

const CLI_TUTORIAL = [
  {
    icon: "01",
    eyebrow: "Platform CLI",
    title: "Talk to Squid from the terminal.",
    body: "The native CLI reads your workspace and can draft proposals. On Core, status is live. Money, agents, and signing stay on the full platform.",
    example: "squid status",
    hint: "Print the Core session and variant."
  },
  {
    icon: "02",
    eyebrow: "Human control",
    title: "The CLI cannot move money here.",
    body: "Holds, wallet signatures, and transfers never run in this Core shell. Risky work becomes a review item on squidpay.dev.",
    example: "squid holds",
    hint: "Opens the full-platform gate from Core."
  },
  {
    icon: "03",
    eyebrow: "Open the real CLI",
    title: "Install the platform binary when you need keys.",
    body: "Core shows the product shape. Production CLI keys, MCP, and write commands live on the private console.",
    example: "npm i -g @squid-pay/cli",
    hint: "Available with the full Squid Pay workspace."
  }
];

function cliSessionPayload() {
  return {
    authenticated: true,
    variant: "core",
    access: "Owner session",
    wallet: {
      provider: state.session.provider,
      address: state.session.address
    },
    safety: "Read and talk only. Wallet signing and money stay on squidpay.dev."
  };
}

function runCliCommand(raw) {
  const command = String(raw || "").trim();
  if (!command) return;
  const key = command.replace(/^squid\s+/, "").toLowerCase();
  if (key === "status" || key === "session") {
    state.cliLog.push({ command, kind: "", output: JSON.stringify(cliSessionPayload(), null, 2) });
  } else if (key === "help" || key === "--help") {
    state.cliLog.push({
      command,
      kind: "system",
      output:
        "Core commands\n  squid status    Session and variant\n  squid session   Connected wallet\n  squid help      This list\n\nFull-platform only\n  squid agents    Create and inspect agents\n  squid holds     Review queue\n\nOpen https://squidpay.dev for the native CLI."
    });
  } else if (key === "clear") {
    state.cliLog = [];
  } else {
    state.cliLog.push({
      command,
      kind: "error",
      output: `core: '${command}' is not available in this variant.\nOpen ${FULL} for the platform CLI.`
    });
  }
  renderCli();
}

function renderCliTutorial() {
  const tutorial = document.getElementById("cli-tutorial");
  if (!tutorial) return;
  const step = CLI_TUTORIAL[state.cliTutorial.step] || CLI_TUTORIAL[0];
  tutorial.hidden = !state.cliTutorial.open;
  document.getElementById("cli-tutorial-step").textContent = `Step ${state.cliTutorial.step + 1} of ${CLI_TUTORIAL.length}`;
  document.getElementById("cli-tutorial-icon").textContent = step.icon;
  document.getElementById("cli-tutorial-eyebrow").textContent = step.eyebrow;
  document.getElementById("cli-tutorial-title").textContent = step.title;
  document.getElementById("cli-tutorial-body").textContent = step.body;
  document.getElementById("cli-tutorial-example").textContent = step.example;
  document.getElementById("cli-tutorial-hint").textContent = step.hint;
  tutorial.querySelectorAll(".cli-tutorial-dots i").forEach((dot, index) => {
    dot.classList.toggle("active", index === state.cliTutorial.step);
  });
  document.getElementById("cli-tutorial-back").hidden = state.cliTutorial.step === 0;
  document.getElementById("cli-tutorial-next").textContent =
    state.cliTutorial.step === CLI_TUTORIAL.length - 1 ? "Start CLI" : "Next";
}

function renderCli() {
  if (!state.cliLog.length) {
    state.cliLog.push({
      command: "squid status",
      kind: "system",
      output: JSON.stringify(cliSessionPayload(), null, 2)
    });
  }
  const entries = state.cliLog
    .map(
      (entry) => `
        <div class="cli-entry ${entry.kind || ""}">
          <div class="cli-entry-command"><span>squid@core</span>${escapeHtml(entry.command)}</div>
          <pre>${escapeHtml(entry.output)}</pre>
        </div>`
    )
    .join("");
  const commands = CLI_COMMANDS.map(
    (item) =>
      `<button type="button" data-cli="${escapeHtml(item.command)}"><span>${escapeHtml(item.label)}</span><code>${escapeHtml(item.command)}</code></button>`
  ).join("");
  content.innerHTML = `
    <header class="cli-topbar">
      <a class="cli-brand" href="#/home">
        <img src="/brand/favicon.png" alt="" />
        Squid
        <span class="cli-badge">CORE</span>
      </a>
      <div class="cli-top-actions">
        <div class="cli-connection connected"><i></i> Connected</div>
        <button class="cli-button" id="cli-theme" type="button">Theme</button>
        <a class="cli-button" href="#/home">Console</a>
        <a class="cli-button" href="${FULL}" target="_blank" rel="noreferrer">Open Squid Pay</a>
      </div>
    </header>
    <div class="cli-layout">
      <aside class="cli-sidebar">
        <div>
          <p class="eyebrow">Native Squid</p>
          <h1>Platform CLI</h1>
          <p>Read your workspace and create proposals for review. Commands run through Squid.</p>
        </div>
        <div class="cli-safety">
          <strong>Human control stays on</strong>
          <p>The CLI cannot approve holds, sign transactions, or move money on Core.</p>
        </div>
        <div class="cli-command-list">${commands}</div>
        <div class="cli-native-note">
          <span>Native install</span>
          <code>npm i -g @squid-pay/cli</code>
          <p>Production keys stay on the <strong>full platform</strong>.</p>
        </div>
      </aside>
      <section class="cli-console">
        <div class="cli-console-head">
          <div>
            <i class="terminal-dot red"></i>
            <i class="terminal-dot yellow"></i>
            <i class="terminal-dot green"></i>
            <strong>squid@platform</strong>
          </div>
          <div>
            <button class="cli-text-button" id="cli-clear" type="button">Clear</button>
            <button class="cli-text-button" id="cli-guide" type="button">Guide</button>
          </div>
        </div>
        <div class="cli-output" id="cli-output">${entries}</div>
        <form class="cli-prompt" id="cli-form">
          <label>squid<span>$</span></label>
          <input name="command" placeholder="squid status" autocomplete="off" />
          <button type="submit">Run</button>
        </form>
      </section>
    </div>
    <div class="cli-tutorial" id="cli-tutorial" ${state.cliTutorial.open ? "" : "hidden"}>
      <div class="cli-tutorial-backdrop" id="cli-tutorial-backdrop"></div>
      <div class="cli-tutorial-card">
        <div class="cli-tutorial-head">
          <span id="cli-tutorial-step"></span>
          <button type="button" id="cli-tutorial-close" aria-label="Close">×</button>
        </div>
        <div class="cli-tutorial-icon" id="cli-tutorial-icon"></div>
        <p class="eyebrow" id="cli-tutorial-eyebrow"></p>
        <h2 id="cli-tutorial-title"></h2>
        <p id="cli-tutorial-body"></p>
        <div class="cli-tutorial-example">
          <code id="cli-tutorial-example"></code>
          <span id="cli-tutorial-hint"></span>
        </div>
        <div class="cli-tutorial-dots">${CLI_TUTORIAL.map(() => "<i></i>").join("")}</div>
        <div class="cli-tutorial-actions">
          <button type="button" id="cli-tutorial-skip">Skip</button>
          <div>
            <button type="button" id="cli-tutorial-back">Back</button>
            <button class="primary" type="button" id="cli-tutorial-next">Next</button>
          </div>
        </div>
      </div>
    </div>
  `;
  renderCliTutorial();
  const output = document.getElementById("cli-output");
  output.scrollTop = output.scrollHeight;
  document.getElementById("cli-theme").onclick = cycleTheme;
  document.getElementById("cli-clear").onclick = () => {
    state.cliLog = [];
    renderCli();
  };
  document.getElementById("cli-guide").onclick = () => {
    state.cliTutorial.open = true;
    renderCliTutorial();
  };
  document.getElementById("cli-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.target.elements.command;
    runCliCommand(input.value);
  });
  content.querySelectorAll("[data-cli]").forEach((button) => {
    button.onclick = () => runCliCommand(button.dataset.cli);
  });
  const closeTutorial = () => {
    state.cliTutorial.open = false;
    renderCliTutorial();
  };
  document.getElementById("cli-tutorial-close").onclick = closeTutorial;
  document.getElementById("cli-tutorial-backdrop").onclick = closeTutorial;
  document.getElementById("cli-tutorial-skip").onclick = closeTutorial;
  document.getElementById("cli-tutorial-back").onclick = () => {
    state.cliTutorial.step = Math.max(0, state.cliTutorial.step - 1);
    renderCliTutorial();
  };
  document.getElementById("cli-tutorial-next").onclick = () => {
    if (state.cliTutorial.step >= CLI_TUTORIAL.length - 1) {
      closeTutorial();
      return;
    }
    state.cliTutorial.step += 1;
    renderCliTutorial();
  };
}

const SETTINGS_CONTINENTS = [
  { value: "africa", label: "Africa" },
  { value: "asia", label: "Asia" },
  { value: "europe", label: "Europe" },
  { value: "north-america", label: "North America" },
  { value: "oceania", label: "Oceania" },
  { value: "south-america", label: "South America" }
];

const SETTINGS_COUNTRIES = {
  africa: ["Egypt", "Kenya", "Nigeria", "South Africa"],
  asia: ["India", "Indonesia", "Japan", "Singapore", "South Korea"],
  europe: ["France", "Germany", "Italy", "Netherlands", "Spain", "United Kingdom"],
  "north-america": ["Canada", "Mexico", "United States"],
  oceania: ["Australia", "New Zealand"],
  "south-america": ["Argentina", "Brazil", "Chile"]
};

function profileFromSession() {
  const session = state.session || {};
  const provider = PROVIDER_LABELS[session.provider] || "wallet";
  const address = session.address || "";
  const email = String(session.email || "").trim();
  const name = String(session.name || (session.provider === "email" ? "" : provider)).trim();
  const initial = (name || provider || "S").charAt(0).toUpperCase();
  return {
    name,
    email,
    initial,
    provider,
    address,
    agents: 0
  };
}

function settingsSelectOptions(entries, selected) {
  return entries
    .map((entry) => {
      const value = typeof entry === "string" ? entry : entry.value;
      const label = typeof entry === "string" ? entry : entry.label;
      return `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
    })
    .join("");
}

function renderSettings() {
  const profile = profileFromSession();
  const countryOptions = Object.values(SETTINGS_COUNTRIES).flat();
  content.innerHTML = `
    <div class="view settings-page">
      <section class="band settings-photo">
        <div>
          <h3>Profile picture</h3>
          <p>Shown on Home and account access.</p>
        </div>
        <div class="settings-photo-row">
          <div class="profile-picture" aria-hidden="true">${escapeHtml(profile.initial)}</div>
          <button class="file-button" id="settings-picture" type="button">Choose picture</button>
        </div>
      </section>
      <label class="settings-field">Your name
        <input id="settings-name" value="${escapeHtml(profile.name)}" placeholder="Your name" autocomplete="name" />
      </label>
      <label class="settings-field settings-email">Email address
        <span class="settings-email-row">
          <input id="settings-email" type="email" value="${escapeHtml(profile.email)}" placeholder="${profile.email ? "" : "Not stored on this Core session"}" autocomplete="email" />
          <button id="settings-save-email" type="button">Save</button>
        </span>
      </label>
      <section class="location-picker settings-location">
        <div class="location-picker-head">
          <div>
            <p class="eyebrow">Location</p>
            <strong class="location-picker-title">Account location</strong>
            <p class="location-picker-copy">Set when this account was created. It does not update when you change cities or travel.</p>
          </div>
        </div>
        <p class="location-picker-status">Not set for this session. Location locks on the full platform.</p>
        <div class="location-picker-fields">
          <label>Continent
            <select id="settings-continent">
              <option value="">Select continent</option>
              ${settingsSelectOptions(SETTINGS_CONTINENTS, "")}
            </select>
          </label>
          <label>Country
            <select id="settings-country">
              <option value="">Select country</option>
              ${settingsSelectOptions(countryOptions, "")}
            </select>
          </label>
        </div>
      </section>
      <div class="settings-split">
        <section class="band settings-account">
          <p class="eyebrow">Account type</p>
          <strong>Individual</strong>
          <div class="settings-account-modes">
            <label>Usage mode
              <select id="settings-usage">
                <option selected>Individual</option>
                <option>Business</option>
              </select>
            </label>
            <label>Daily use mode
              <select id="settings-daily">
                <option selected>Home / Daily Use</option>
                <option>Trader</option>
              </select>
            </label>
          </div>
          <p class="settings-footnote">Home / Daily Use is the default. Trader unlocks live Hyperliquid after you type TRADE.</p>
        </section>
        <section class="band settings-agents">
          <div>
            <p class="eyebrow">Connected agents</p>
            <strong>${profile.agents}</strong>
          </div>
          <button class="ghost" data-core="Connected agents" type="button" aria-label="Agent options">⋯</button>
        </section>
      </div>
    </div>
  `;
  const gate = (title) =>
    openCoreModal(title, `${title} is full-platform. Core shows the signed-in session only.`);
  document.getElementById("settings-picture").onclick = () => gate("Choose picture");
  document.getElementById("settings-save-email").onclick = () => gate("Save email");
  ["settings-continent", "settings-country", "settings-usage", "settings-daily"].forEach((id) => {
    const field = document.getElementById(id);
    field.onchange = () => {
      field.selectedIndex = 0;
      gate(field.previousSibling && field.previousSibling.textContent ? field.previousSibling.textContent.trim() : "Settings");
    };
  });
  content.querySelectorAll("[data-core]").forEach((button) => {
    button.onclick = () => gate(button.dataset.core);
  });
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

applyTheme();
refreshSession()
  .catch(() => {})
  .finally(() => renderRoute(currentRoute()));

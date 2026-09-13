import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("wallet connect gate", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const css =
    readFileSync(new URL("../public/styles.css", import.meta.url), "utf8") +
    readFileSync(new URL("../public/platform.css", import.meta.url), "utf8");

  it("uses the Squid icon as the app favicon", () => {
    assert.match(html, /rel="icon" href="\/favicon.ico"/);
    assert.match(html, /href="\/brand\/favicon.png"/);
    assert.doesNotMatch(html, /rel="icon" href="\/brand\/mark.svg"/);
    assert.equal(existsSync(new URL("../public/favicon.ico", import.meta.url)), true);
    assert.equal(existsSync(new URL("../public/brand/favicon.png", import.meta.url)), true);
  });

  it("shows a connect screen before the platform shell", () => {
    assert.match(html, /id="connect-gate"/);
    assert.match(html, /wallet-onboarding/);
    assert.match(html, /Connect a wallet to enter the platform/);
    assert.match(html, /id="app-shell" hidden/);
    assert.match(html, /wallet-gate-active/);
  });

  it("uses the Squid console nav and keeps wallet out of the sidebar", () => {
    const nav = html.slice(html.indexOf('id="nav"'), html.indexOf("sidebar-footer"));
    assert.match(nav, /data-route="home"/);
    assert.match(nav, /data-route="chat"/);
    assert.match(nav, /data-route="money"/);
    assert.match(nav, /data-route="activity"/);
    assert.doesNotMatch(nav, /data-route="wallet"/);
  });

  it("uses compact ops chrome and the platform accent tokens", () => {
    assert.match(html, /id="choose-agent"/);
    assert.match(html, />ops</);
    assert.doesNotMatch(html, /Choose agent/);
    assert.match(html, /id="wallet-chip"/);
    assert.match(html, /Signed in with wallet/);
    assert.match(css, /--accent:\s*#2563eb/i);
    assert.match(css, /--bg-sidebar:\s*#fafbfc/i);
    assert.match(css, /--radius-btn:\s*0/);
    assert.match(app, /action-chip primary/);
    assert.match(app, /Signed in with/);
  });

  it("renders the Squid Wallet home panel instead of metric cards", () => {
    assert.match(app, /Squid Wallet/);
    assert.match(app, /Your embedded Squid wallet is created automatically with email login/);
    assert.match(app, /data-core="Deposit"/);
    assert.match(app, /data-core="Send"/);
    assert.doesNotMatch(app, /Copy address/);
    assert.doesNotMatch(app, /squid-wallet-actions/);
    assert.match(app, /Balances across your Squid wallet and connected wallets/);
    assert.match(app, /id="home-agents"/);
    assert.match(app, /Agents <kbd>A<\/kbd>/);
    assert.doesNotMatch(app, /Connect agent/);
    assert.doesNotMatch(app, /Recent activity/);
    assert.doesNotMatch(app, /Planned payments/);
  });

  it("stacks connect-gate wallets in one column", () => {
    const block = css.match(/\.wallet-picker\s*\{[^}]+\}/)?.[0] || "";
    const buttons = css.match(/\.wallet-picker button\s*\{[^}]+\}/)?.[0] || "";
    assert.match(html, /class="wallet-picker" id="gate-wallets"/);
    assert.match(block, /display:\s*grid/);
    assert.match(block, /width:\s*100%/);
    assert.match(buttons, /width:\s*100%/);
    assert.match(buttons, /height:\s*52px/);
    assert.match(buttons, /min-height:\s*52px/);
  });

  it("uses the platform theme tokens and CLI chrome", () => {
    assert.match(css, /color-scheme:\s*light/);
    assert.match(css, /prefers-color-scheme:\s*dark/);
    assert.match(css, /html\[data-theme="dark"\]/);
    assert.match(css, /\.cli-topbar\s*\{/);
    assert.match(css, /\.cli-console\s*\{/);
    assert.match(css, /\.cli-tutorial\s*\{/);
    assert.match(app, /class="cli-layout"/);
    assert.match(app, /Platform CLI/);
    assert.match(app, /squid status/);
  });

  it("blocks platform routes until a session exists and only Chat talks", () => {
    assert.match(app, /if \(!isConnected\(\)\)/);
    assert.match(app, /renderConnectGate\(\)/);
    assert.match(app, /Only Squid AI \/ Chat works here/);
    assert.match(app, /Talk to Squid AI/);
  });

  it("renders the product Squid AI empty state with example actions", () => {
    assert.match(app, /chat-message chat-welcome/);
    assert.match(app, /Example actions/);
    assert.match(app, /What can ops do\?/);
    assert.match(app, /Portfolio scan/);
    assert.match(app, /Prepare a payment, trade, automation, or token/);
    assert.match(app, /class="chat-attach"/);
    assert.match(app, /class="primary chat-send"/);
    assert.doesNotMatch(app, /Talk only on Core/);
    assert.doesNotMatch(app, /horatiucode/);
  });

  it("puts Trade intensity above the existing Activity log", () => {
    assert.match(app, /Trade intensity/);
    assert.match(app, /Day of week × hour/);
    assert.match(app, /Which console area has the most activity/);
    assert.match(app, /heat-grid/);
    assert.match(app, /where-list/);
    assert.match(app, /Activity log/);
    assert.match(app, /Show/);
    const intensityAt = app.indexOf("<h2>Trade intensity</h2>");
    const coreAt = app.indexOf("Only Squid AI / Chat works here. Activity lives");
    const logAt = app.indexOf("<h3>Activity log</h3>");
    assert.ok(intensityAt > 0 && intensityAt < coreAt && coreAt < logAt);
  });

  it("fills Settings from the signed-in session instead of a sample profile", () => {
    assert.match(app, /function profileFromSession/);
    assert.match(app, /Profile picture/);
    assert.match(app, /Your name/);
    assert.match(app, /Email address/);
    assert.match(app, /Account location/);
    assert.match(app, /Connected agents/);
    assert.match(app, /Home \/ Daily Use/);
    assert.match(app, /session\.email/);
    assert.match(app, /session\.name/);
    assert.doesNotMatch(app, /horatiucode/);
    assert.doesNotMatch(app, /Workspace, keys, and safety controls/);
  });
});

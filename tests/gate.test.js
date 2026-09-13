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
    assert.match(html, /class="wallet-picker" id="gate-wallets"/);
    assert.match(block, /display:\s*grid/);
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
});

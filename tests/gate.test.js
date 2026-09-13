import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("wallet connect gate", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");

  it("shows a connect screen before the platform shell", () => {
    assert.match(html, /id="connect-gate"/);
    assert.match(html, /Connect a wallet to enter the platform/);
    assert.match(html, /id="app-shell" hidden/);
    assert.match(html, /class="on-gate"/);
  });

  it("uses the Squid console nav and keeps wallet out of the sidebar", () => {
    const nav = html.slice(html.indexOf('id="nav"'), html.indexOf("sidebar-foot"));
    assert.match(nav, /data-route="home"/);
    assert.match(nav, /data-route="chat"/);
    assert.match(nav, /data-route="money"/);
    assert.match(nav, /data-route="activity"/);
    assert.doesNotMatch(nav, /data-route="wallet"/);
  });

  it("uses compact ops chrome, a blue status accent, and a blue Deposit action", () => {
    assert.match(html, /id="choose-agent"/);
    assert.match(html, />\s*ops\s*</);
    assert.doesNotMatch(html, /Choose agent/);
    assert.match(html, /class="session-strip"/);
    assert.match(html, /id="wallet-chip"/);
    assert.match(html, /Signed in with wallet/);
    assert.match(css, /--blue:\s*#3b82f6/i);
    const stripText = css.match(/\.session-strip p\s*\{[^}]+\}/)?.[0] || "";
    assert.match(stripText, /border-left:\s*2px\s+solid\s+var\(--blue\)/);
    assert.match(app, /class="btn-blue" data-core="Deposit"/);
    assert.match(app, /Signed in with/);
  });

  it("renders the Squid Wallet home panel instead of metric cards", () => {
    assert.match(app, /Squid Wallet/);
    assert.match(app, /Your embedded Squid wallet is created automatically with email login/);
    assert.match(app, /Copy address/);
    assert.match(app, /Balances across your Squid wallet and connected wallets/);
    assert.match(app, /id="home-agents"/);
    assert.match(app, /Agents <span class="key">A<\/span>/);
    assert.doesNotMatch(app, /Connect agent/);
    assert.doesNotMatch(app, /Recent activity/);
    assert.doesNotMatch(app, /Planned payments/);
  });

  it("stacks connect-gate wallets in one column", () => {
    const block = css.match(/\.wallet-grid\s*\{[^}]+\}/)?.[0] || "";
    assert.match(html, /class="wallet-grid" id="gate-wallets"/);
    assert.match(block, /grid-template-columns:\s*1fr;/);
    assert.doesNotMatch(block, /1fr\s+1fr/);
    assert.match(block, /max-width:\s*420px/);
  });

  it("blocks platform routes until a session exists and only Chat talks", () => {
    assert.match(app, /if \(!isConnected\(\)\)/);
    assert.match(app, /renderConnectGate\(\)/);
    assert.match(app, /Only Squid AI \/ Chat works here/);
    assert.match(app, /Talk to Squid AI/);
  });
});

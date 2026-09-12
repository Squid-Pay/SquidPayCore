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

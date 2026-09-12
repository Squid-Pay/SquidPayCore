import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("wallet connect gate", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

  it("shows a connect screen before the platform shell", () => {
    assert.match(html, /id="connect-gate"/);
    assert.match(html, /Connect a wallet to enter the/);
    assert.match(html, /id="app-shell" hidden/);
    assert.match(html, /class="on-gate"/);
  });

  it("keeps wallet out of the in-app sidebar", () => {
    const nav = html.slice(html.indexOf('id="nav"'), html.indexOf("sidebar-foot"));
    assert.match(nav, /data-route="home"/);
    assert.match(nav, /data-route="ai"/);
    assert.doesNotMatch(nav, /data-route="wallet"/);
  });

  it("blocks platform routes until a session exists", () => {
    assert.match(app, /if \(!isConnected\(\)\)/);
    assert.match(app, /renderConnectGate\(\)/);
    assert.match(app, /Disconnect to leave the platform/);
  });
});

# Squid Pay Core

Open-core variant of [Squid Pay](https://squidpay.dev).

**This repository is only the Core cut.** The full Squid Pay application is **not open source**. What you see here is a small, public slice so people can connect a wallet and talk to Squid AI. Money movement, agents, cards, review holds, CLI keys, and the rest of the product stay on the private platform.

If a screen looks like the main console but does not work here, that is intentional. Core shows the shape of the product and sends you to [squidpay.dev](https://squidpay.dev) for the real thing.

## What “open core” means here

Open core is not “the whole app, minus a license.” It is a **limited public variant**:

| In this repo (Core) | Not in this repo (full Squid Pay) |
| --- | --- |
| Wallet connect (MetaMask, Coinbase Wallet, Phantom, Backpack) | Deposits, sends, payment links |
| Squid AI / Chat | Agent wallets, budgets, and permissions |
| Console layout so the product is recognizable | Virtual cards, policies, Needs Review |
| Honest “Core variant” gates | Trading, investing, catalog, MCP, platform CLI keys |

The full app at [squidpay.dev](https://squidpay.dev) is proprietary. Do not treat this repo as a source dump of Squid Pay. Shipping Core does not grant rights to the private console, backend, or production money-movement stack.

## What the project is

Squid Pay is financial infrastructure for the agent economy: a bank-like console where a human owner connects a wallet, agents **propose** payments or trades, and the owner still signs. Squid never holds seed phrases. Risky actions become Needs Review holds. Money moves only after the owner wallet signs and Squid verifies the chain receipt.

Core keeps that story visible and keeps the live surface small:

1. Connect a browser wallet to enter (session signature only — no funds move).
2. Use **Squid AI / Chat** to talk about the session and the product.
3. Everything else in the sidebar (Home chrome, Money, Agents, Activity, CLI, Settings) is the Core shell. Actions go to [squidpay.dev](https://squidpay.dev).

Disconnect / Log out returns you to the wallet gate.

## Run

```bash
npm install
npm start
```

Open [http://localhost:4173](http://localhost:4173).

```bash
npm test
```

Optional live Squid AI (otherwise Core uses the built-in assistant):

```bash
cp .env.example .env
# set OPENAI_API_KEY
```

## License

The files in this repository are the Core variant only. The complete Squid Pay application is closed source and is not included here. Use the full product at **https://squidpay.dev**.

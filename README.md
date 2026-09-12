# Squid Pay Core

Open-core variant of [Squid Pay](https://squidpay.dev).

Core includes:

- A wallet **connect gate** before the console — **MetaMask**, **Coinbase Wallet**, **Phantom**, or **Backpack**
- **Squid AI** after you are in the platform

Everything else that appears in the main Squid Pay console — payments, agent cards, trading, investing, agents, Needs Review, payment links, policies, catalog, developer keys, and settings — stays a **core variant** screen and sends you to [squidpay.dev](https://squidpay.dev).

Core never stores a seed phrase or private key. The owner wallet remains the signer.

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

## What this is

Squid Pay Core is the simple path: connect a browser wallet to enter, talk to Squid AI, and see the rest of the product as the full-platform surface. Disconnect returns you to the connect screen.

The full product — holds, agent budgets, MCP, cards, and money movement — lives at **https://squidpay.dev**.

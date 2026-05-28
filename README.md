# Zero Task Router

> Describe any task in plain English → Zero finds the best capability → x402 pays automatically in USDC → you get the result. **No API keys. No subscriptions.**

Built by **Team XOF** for the [Zero UNLOCKED Hackathon](https://www.zero.xyz/) — May 2026.

Live demo: https://zero-task-router.vercel.app/

This is **Aisling's fork** — improvements on top of the team build at [`jp-bmn/zero-task-router`](https://github.com/jp-bmn/zero-task-router) (branch `juan-frontend`).

## What it does

A four-step Bento Box dashboard wrapping the Zero CLI loop:

1. **Search** — type a plain-English task; Zero's registry returns ranked capabilities with cost + rating.
2. **Inspect** — pick one; auto-render its JSON schema + populate request body with sane defaults.
3. **Run** — execute via `/api/run` → either `zero fetch` (local) or direct x402 HTTP payment (Vercel).
4. **Review** — submit 3-axis rating (accuracy / value / reliability) + optional note. Feeds Zero's public ranking.

## Quick start

### 1. Install Zero CLI globally

```bash
npm install -g @zeroxyz/cli
zero --version
```

### 2. Create + fund wallet

```bash
zero init                       # generates ~/.zero/config.json — back this up
zero wallet fund --no-open      # prints one-time funding URL; open in browser
zero wallet balance             # confirm USDC arrived on Base
```

Claim the $5 welcome bonus at https://www.zero.xyz/ before topping up.

### 3. Clone + configure

```bash
git clone https://github.com/aislingld-pursuit/zero-task-router.git
cd zero-task-router
npm install
cp .env.example .env.local
# Edit .env.local — paste your wallet private key from ~/.zero/config.json
```

### 4. Run

```bash
npm run dev                     # → http://localhost:3000
```

## Project structure

```
zero-task-router/
├── app/
│   ├── api/
│   │   ├── search/route.ts     # zero search <query>
│   │   ├── get/route.ts        # zero get <n> --formatted
│   │   ├── run/route.ts        # zero fetch OR direct x402 HTTP
│   │   ├── review/route.ts     # zero review <runId> --accuracy ... --value ... --reliability ...
│   │   └── balance/route.ts    # zero wallet balance OR Base RPC eth_call
│   ├── layout.tsx              # root + OG/Twitter meta
│   ├── page.tsx                # Bento Box SPA
│   └── globals.css
├── public/
├── .env.example
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router (Server Routes for API) |
| UI | React 19 + inline styled components, no Tailwind dependency |
| Wallet / chain | viem 2.x — Base mainnet |
| Payment protocol | `x402` package 1.2 — handles 402 challenges directly when CLI unavailable |
| Capability shell | Zero CLI via `execFileSync` (local dev) |

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `ZERO_PRIVATE_KEY` | (none — required) | Wallet key for x402 signing. Server throws if missing. |
| `ZERO_MAX_PAY_CEILING` | `0.50` | Hard cap USDC per call. Frontend slider cannot exceed this. |

## Security notes

- **Never commit `.env.local`** — it contains the wallet private key. `.gitignore` already covers `.env*`.
- Server uses `execFileSync(cmd, [args])` — shell metacharacters in user input do not execute.
- `ZERO_MAX_PAY_CEILING` enforced server-side; client cannot exceed regardless of slider value.
- If a private key ever lands in git history: `git filter-repo` to scrub, then `zero init --force` to rotate.

## Differences from upstream `juan-frontend`

This fork (`aisling-improvements` branch) adds:

1. **Security**: removed hardcoded private-key fallback; fixed `execSync` command-injection across all 4 CLI-wrapping routes; enforced server-side `--max-pay` ceiling.
2. **Review**: 3rd star rating (Reliability) + optional content note to fully match Zero CLI's review schema. Previous version aliased reliability to accuracy.
3. **Validation**: inline JSON error on request-body textarea; query-length cap; runId regex check.
4. **UX**: Reset button in header (clears all state for back-to-back judging demos); responsive Bento grid (collapses to single column under 900px).
5. **Meta**: OG / Twitter cards on layout for shareable preview.
6. **Docs**: this README + `.env.example` instead of the default Create-Next-App boilerplate.

## Team

Built at Zero UNLOCKED Hackathon · May 2026 by **Team XOF**:

- Aisling Leiva-Davila ([@aislingld-pursuit](https://github.com/aislingld-pursuit)) — frontend / docs / this fork
- Jillian Krebsbach ([@JillK83](https://github.com/JillK83)) — schema auto-form
- Joel Philip ([@jp-bmn](https://github.com/jp-bmn)) — backend / repo owner
- Naquan Mckune ([@naquanm621](https://github.com/naquanm621)) — frontend
- Richard Theard ([@Tatopapi3](https://github.com/Tatopapi3)) — SSE + chain demo

## License

MIT.

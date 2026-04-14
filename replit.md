# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

The workspace includes a React/Vite web app artifact, **Monitor Giełdowy**, at the root preview path (`/`). It is a Polish stock watchlist dashboard based on the uploaded `attached_assets/stock-monitor_1776070769581.html`, with local watchlist persistence, locally stored Finnhub/Groq API keys, cached stock data, AI analysis tabs, news, investment score panels, loading/error/empty states, editable favorite ticker chips, CSV export, a share purchase calculator, and support for Polish ticker formats such as `SNT.PL` and `PKN.WA`.

Recent additions include a GPW search suggestion endpoint backed by a curated Polish stock list, Stooq quote normalization for `.PL`/`.WA` tickers, per-company API fetch timestamps, a TradingView 5-day chart tab on each stock card, and a separate **Analizy CFD** mode for currencies, commodities, crypto and indices. The CFD mode uses a TradingView scanner proxy for 1D technical values including RSI, EMA, HMA and recommendation scores, displays a 5-day TradingView chart, generates long/short probability summaries, includes editable CFD favorite tickers, historical signal filtering for 24h or 5 days, CSV export for historical signals, and provides a CFD profit calculator. USOIL maps to `NYMEX:CL1!` for TradingView data.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Web app**: React + Vite (`artifacts/stock-monitor`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/stock-monitor run dev` — run Monitor Giełdowy locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

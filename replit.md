# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

The workspace now includes a React/Vite web app artifact, **Monitor Giełdowy**, at the root preview path (`/`). It is a Polish stock watchlist dashboard based on the uploaded `attached_assets/stock-monitor_1776070769581.html`, with local watchlist persistence, locally stored Finnhub/Groq API keys, cached stock data, AI analysis tabs, news, investment score panels, loading/error/empty states, and quick ticker chips.

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

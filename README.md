# Todo Application Monorepo

A mobile-friendly todo application built as an npm workspaces monorepo with separate **API** and **web** deploy tiers.

## Requirements

- Node.js **18.18** or newer (Node 20 LTS recommended)
- npm 9 or newer
- Docker and Docker Compose (optional, for containerised deployment)

## Packages

| Package | Path | Description |
| ------- | ---- | ----------- |
| `@todo/api` | `packages/api` | Express + TypeScript API backed by MongoDB |
| `@todo/web` | `packages/web` | React 18 + Vite web client |

## Install

```bash
npm install
```

Copy `.env.example` to `.env` and adjust values for local development.

## Commands

| Command | What it does |
| ------- | ------------ |
| `npm run build` | Builds all workspace packages |
| `npm test -- --run` | Runs the Vitest suites in every package |
| `npm run dev:api` | Starts the API in watch mode |
| `npm run dev:web` | Starts the Vite dev server |
| `npm run start:api` | Runs the compiled API (`packages/api`) |
| `npm run start:web` | Serves the built web client (`packages/web`) |

### API (`packages/api`)

Environment variables:

| Variable | Description |
| -------- | ----------- |
| `PORT` | HTTP port (default `3000`) |
| `MONGODB_URI` | MongoDB connection string (**required**) |
| `MONGODB_DB_NAME` | Database name (default `todo_app`) |

```bash
npm run dev:api
```

### Web (`packages/web`)

The web client reads its API base URL from `VITE_API_URL` (see `.env.example`).

```bash
npm run dev:web
```

## Deploy tiers

`docker-compose.yml` defines three services:

1. **mongo** — MongoDB database used exclusively by the API tier
2. **api** — Express API (`depends_on: mongo`)
3. **web** — static React client served by Vite preview (`depends_on: api`)

Start the full stack:

```bash
docker compose up --build
```

- API: <http://localhost:3000/health>
- Web: <http://localhost:4173>

## Project structure

```
.
├── package.json              # Workspace root
├── .env.example              # Shared environment template
├── docker-compose.yml        # api + web deploy tiers
└── packages/
    ├── api/                  # Express API (MongoDB)
    └── web/                  # React + Vite client (VITE_API_URL)
```

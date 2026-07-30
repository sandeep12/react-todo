# React Todo App

A mobile-friendly todo list application built with **React 18**, **TypeScript** and **Vite**,
tested with **Vitest** and **React Testing Library**.

## Requirements

- Node.js 18.18 or newer (Node 20 LTS recommended)
- npm 9 or newer (ships with recent Node versions)

## Install

From a clean checkout:

```bash
npm install
```

## Commands

| Command            | What it does                                                                 |
| ------------------ | ---------------------------------------------------------------------------- |
| `npm run dev`      | Starts the Vite dev server with hot module replacement at http://localhost:5173 |
| `npm run build`    | Type-checks the project and emits production assets to `dist/`               |
| `npm run preview`  | Serves the built `dist/` output locally at http://localhost:4173              |
| `npm test`         | Runs the Vitest + React Testing Library suite once (CI mode)                  |
| `npm run test:watch` | Runs the test suite in watch mode                                           |
| `npm run typecheck` | Runs the TypeScript compiler in no-emit mode over app and config files       |

### Development

```bash
npm run dev
```

The dev server listens on all network interfaces, so you can also open the printed
`Network:` URL on a phone connected to the same Wi-Fi to check the mobile layout.

### Production build & preview

```bash
npm run build
npm run preview
```

`npm run build` fails fast on type errors before Vite bundles the app. The generated
static assets in `dist/` can be deployed to any static host.

### Tests

```bash
npm test
```

Vitest runs in a `jsdom` environment with `vitest.setup.ts` registering
`@testing-library/jest-dom` matchers and DOM cleanup between tests. Test files live
next to the code they cover and are matched by `src/**/*.{test,spec}.{ts,tsx}`.

## Project structure

```
.
├── index.html            # HTML entry point (viewport meta + base styles)
├── src/
│   ├── main.tsx          # Mounts the React root into #root
│   ├── App.tsx           # Application shell
│   ├── smoke.test.tsx    # Smoke test that renders the app
│   └── vite-env.d.ts     # Vite client type definitions
├── vite.config.ts        # Build / dev server configuration
├── vitest.config.ts      # Test runner configuration
├── vitest.setup.ts       # Global test setup (matchers, cleanup)
├── tsconfig.json         # TypeScript config for application sources
└── tsconfig.node.json    # TypeScript config for Node-side config files
```

## Mobile support

- `index.html` declares `<meta name="viewport" content="width=device-width, initial-scale=1" />`.
- A global `border-box` box model, `max-width: 100%` media/controls and `overflow-x: hidden`
  on `body` keep the layout from overflowing horizontally.
- The app shell is centred with a `max-width` container and fluid width, so it renders
  correctly down to a 375px viewport (iPhone SE class devices) and below.

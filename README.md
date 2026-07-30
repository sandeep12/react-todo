# Todo App

A mobile-friendly todo application built with **React 18**, **TypeScript** and **Vite**, tested with
**Vitest** and **React Testing Library**.

## Requirements

- Node.js **18.18** or newer (Node 20 LTS recommended)
- npm 9 or newer (ships with the Node versions above)

## Install

```bash
npm install
```

## Commands

| Command            | What it does                                                                 |
| ------------------ | ---------------------------------------------------------------------------- |
| `npm run dev`      | Starts the Vite dev server with hot module replacement on <http://localhost:5173> |
| `npm run build`    | Type-checks the project and emits production assets to `dist/`               |
| `npm run preview`  | Serves the built `dist/` output locally on <http://localhost:4173>            |
| `npm test`         | Runs the Vitest + React Testing Library suite once (CI mode)                 |
| `npm run test:watch` | Runs the test suite in watch mode                                          |
| `npm run typecheck` | Runs the TypeScript compiler without emitting files                         |

### Develop

```bash
npm run dev
```

The dev server binds to all interfaces (`host: true`), so the printed network URL can be opened on a
phone that is on the same Wi-Fi network for real-device testing.

### Build and preview

```bash
npm run build
npm run preview
```

`npm run build` type-checks both the application sources and the config files before Vite writes the
static bundle to `dist/`. `npm run preview` serves exactly those files so the production output can be
verified before deploying.

### Test

```bash
npm test
```

Tests live next to the code in `src/` and match `*.test.ts`/`*.test.tsx`. The harness is configured in
`vitest.config.ts` (jsdom environment, globals enabled) and `vitest.setup.ts` (jest-dom matchers plus
automatic cleanup between tests). A smoke test in `src/smoke.test.tsx` renders the app and asserts the
root heading is present.

## Project structure

```
.
├── index.html          # HTML entry point, viewport meta tag and base layout styles
├── src/
│   ├── main.tsx        # Mounts the React root into #root
│   ├── App.tsx         # Application shell
│   ├── smoke.test.tsx  # Rendering smoke test
│   └── vite-env.d.ts   # Vite client type definitions
├── vite.config.ts      # Vite + React plugin configuration
├── vitest.config.ts    # Vitest configuration (extends the Vite config)
└── vitest.setup.ts     # Test setup: jest-dom matchers and cleanup
```

## Mobile support

- `index.html` declares `<meta name="viewport" content="width=device-width, initial-scale=1" />`.
- Global styles apply `box-sizing: border-box`, remove default body margins and cap media/controls at
  `max-width: 100%`, so the layout does not overflow horizontally at a 375px viewport width.
- The app shell uses a fluid `width: 100%` with `max-width: 40rem`, centring content on wider screens
  while remaining edge-to-edge on phones.

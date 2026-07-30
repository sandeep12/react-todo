# React Todo App

A small, mobile-friendly todo application built with **React 18**, **TypeScript** and **Vite**,
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

| Command             | What it does                                                                   |
| ------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`       | Starts the Vite dev server with hot module replacement on http://localhost:5173 |
| `npm run build`     | Type-checks the project and emits production assets to `dist/`                  |
| `npm run preview`   | Serves the built `dist/` output locally on http://localhost:4173                |
| `npm test`          | Runs the Vitest suite once (CI mode)                                            |
| `npm run test:watch`| Runs Vitest in interactive watch mode                                           |
| `npm run typecheck` | Runs the TypeScript compiler without emitting files                             |

### Development

```bash
npm run dev
```

Open the printed URL (default http://localhost:5173) in a browser. The React root is mounted
into `#root` from `src/main.tsx`.

### Production build and preview

```bash
npm run build
npm run preview
```

`npm run build` writes static assets to `dist/`. `npm run preview` serves that directory so the
production bundle can be verified locally before deploying.

### Tests

```bash
npm test
```

Vitest runs in a `jsdom` environment with `@testing-library/react`. Global test APIs
(`describe`, `it`, `expect`) are enabled and `@testing-library/jest-dom` matchers are registered
in `vitest.setup.ts`, which also unmounts rendered components after each test.

Test files live next to the code they cover and match `src/**/*.{test,spec}.{ts,tsx}`.

## Project structure

```
.
├── index.html          # HTML entry point (viewport meta tag + base styles)
├── src
│   ├── App.tsx         # Root application component
│   ├── main.tsx        # React root creation / mount
│   ├── smoke.test.tsx  # Harness smoke test rendering <App />
│   └── vite-env.d.ts   # Vite client type declarations
├── vite.config.ts      # Vite build/dev configuration
├── vitest.config.ts    # Vitest configuration (extends the Vite config)
├── vitest.setup.ts     # Test setup: jest-dom matchers + RTL cleanup
├── tsconfig.json       # App TypeScript configuration
└── tsconfig.node.json  # TypeScript configuration for config files
```

## Mobile support

The app is designed to be usable on small screens:

- `index.html` declares `<meta name="viewport" content="width=device-width, initial-scale=1" />`.
- A fluid, single-column layout (`width: 100%; max-width: 40rem`) with `box-sizing: border-box`
  and `overflow-x: hidden` keeps content from overflowing horizontally at 375px width.
- Media, form controls and long words are constrained so they wrap instead of forcing
  horizontal scrolling.

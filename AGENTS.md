# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

ShockWallet is a Nostr-native Lightning Network wallet. It's a single React/Ionic/TypeScript SPA (not a monorepo) that targets web (PWA), Android, and iOS from one codebase. There is **no backend server** in this repo — all external services (Nostr relays, Bridge, Sanctum auth, Firebase) are remote.

### Running the dev server

```bash
npm run dev
```

Starts Vite on `http://localhost:8100` with HMR. No local databases or Docker services needed.

### Lint

```bash
npx eslint . --ext .ts,.tsx
```

The codebase has pre-existing lint errors (~130 errors, ~31 warnings). These are not blockers.

### Unit tests

```bash
npm run test.unit
```

Runs Vitest with jsdom environment. Some test files have pre-existing failures (5 of 13 test files fail). The test infrastructure itself works correctly.

### E2E tests

```bash
npm run test.e2e
```

Requires Cypress. Not typically needed for development iteration.

### Environment variables

The `.env` file is already present (copied from `env.development.example`). It contains Vite env vars for the test environment pointing at `shocklab.dev` services. No secrets are required for basic development.

### Key caveats

- The ESLint plugin in `vite.config.ts` is set to `failOnError: false` — lint warnings appear in terminal but don't block the dev server.
- The `testSetup.ts` file is required by Vitest (referenced in `vite.config.ts` under `test.setupFiles`).
- Path aliases: `@` → `src/`, `@tests` → `tests/`.
- The app uses `localStorage` / `IndexedDB` for persistence; clearing browser storage resets the wallet state.

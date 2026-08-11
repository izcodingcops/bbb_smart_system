---
paths: src/redux/**
---

# Redux persistence

- **Bump `PERSIST_VERSION` and add a migration in `src/redux/migrations.ts`
  whenever a persisted slice gains, renames, or changes the shape of a
  field.** Without this, state saved by an older build rehydrates missing
  the new keys and selectors read `undefined` instead of throwing — the bug
  surfaces later, at the read site, not at the point of the actual change.
  Follow the existing migrations (v1–v4) as the template: spread
  `initial<Slice>State` first, then the previous persisted value on top, so
  an install that already has the field keeps it.

- **`ui` is deliberately excluded from persistence** (`persistConfig`
  blacklist in `store.ts`) — don't move ephemeral UI state (sheet
  visibility, setup-intent flags) into a persisted slice without checking
  why it was kept out.

- **`authToken.ts` holds the bearer token outside Redux on purpose**, to
  avoid an import cycle (store → auth slice → GraphQL client → store). The
  auth slice pushes into it on login and on `REHYDRATE` — if you add a new
  place that needs the token at import time, reuse `authToken.get()`, don't
  reach into the store directly from `src/graphql/`.

- **`redux/outbox` is the state half of the offline queue** (`items`
  pending, `failed` dead-lettered); the transport/replay half lives in
  `src/graphql/offlineQueue/`. Changing one usually means checking the
  other — see `.claude/rules/graphql-wiring.md`.

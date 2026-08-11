---
paths: src/graphql/**, src/config/transport.ts
---

# GraphQL feature wiring

Registering a new feature module (or a new offline-capable mutation on an
existing one) touches several files at once — miss one and it fails silently
or type-checks but resolves nothing.

**New feature module**, four registrations beyond the feature's own
`src/graphql/features/<name>/` folder:
- `src/graphql/schema.ts` — import and spread the feature's `typeDefs`.
- `src/graphql/mockSchema.ts` — import and spread the feature's
  `resolvers.Query`/`.Mutation`.
- `src/graphql/cache.ts` — add `typePolicies` entries (`keyFields`) for every
  new type the feature introduces, including nested non-entity types
  (`keyFields: false`).
- `src/config/transport.ts` — add the feature to the `Feature` union and to
  `API_TRANSPORT` (almost always `'mock'` today — see the comment there
  before flipping one to `'graphql'`).

**New offline-capable mutation**, in `src/graphql/offlineQueue/registry.ts`:
- Add an `OFFLINE_MUTATIONS` entry: `document`, `feature`, `refetchQueries`
  (query operation names, not files), and `buildOptimisticData(localId)`
  returning a shape keyed by the mutation's own root field, mirroring what
  the real resolver returns (`__typename`, `id: localId`,
  `reference: 'Pending'` is the existing convention).
- `refetchQueries` here is **unconditional** — the registry can't know at
  flush time whether a per-call conditional (e.g. dispatch-linked incidents)
  applied. Refetching an inactive query still completes; it just triggers
  Apollo's dev-only "unknown query" console warning, not a real error. Don't
  try to make this conditional without a real problem to solve.
- The calling mutation's `context` needs the matching `offlineQueueKey` set,
  or `graphql/offlineQueue/link.ts` never intercepts it and it just fails
  outright when offline instead of queuing.
- `flush.ts` replays queued items **in order** — if the new mutation type
  has an ordering dependency on another queued type (like WorkLog's
  `nextReference()`), that dependency isn't enforced automatically; check
  `flush.ts` before assuming arbitrary interleaving is safe.

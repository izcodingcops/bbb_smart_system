# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm start                 # Metro dev server
npm run ios               # build & run iOS (run `bundle exec pod install` after native dep changes)
npm run android            # build & run Android
npm run lint               # eslint .
```

There is no Jest/test runner configured (no `test` script, no `jest.config.*`, no `*.test.ts(x)` files anywhere). `__mocks__/react-native-safe-area-context.js` is a vestigial leftover from the RN CLI template — don't treat its presence as evidence Jest is wired up.

Instead, correctness is checked with three hand-rolled `node:assert` smoke scripts (each compiles via `tsc` to `.smoke/` then runs with `node`):

```sh
npm run graphql:smoke      # exercises mockSchema directly (login union, notifications shape, etc.)
npm run migration:smoke    # unit-checks redux/migrations.ts transforms
npm run outbox:smoke       # exercises the outbox reducer (enqueue/sync/dead-letter ordering)
```

iOS native deps use Bundler + CocoaPods (`bundle install`, then `bundle exec pod install`). `scripts/start-metro-if-needed.sh` is an Xcode Debug-only build phase that auto-launches Metro in a new Terminal window if port 8081 isn't already serving it — it's a no-op in Release.

## Architecture

**There is no live backend yet.** Every GraphQL feature currently runs against an in-memory mock, not a real gateway — this shapes almost everything else below.

### GraphQL/Apollo mock layer

`src/graphql/client.ts` builds an `ApolloLink.split` between a `SchemaLink` (`mockLink`, wrapping a real executable schema built by `graphql-tools`' `makeExecutableSchema`) and an `HttpLink` pointed at `GRAPHQL_ENDPOINT` (`src/config/transport.ts`, currently `'https://REPLACE_ME/graphql'`). Routing is per-`Feature` via `src/config/transport.ts`'s `API_TRANSPORT` map — every feature is set to `'mock'` today, so 100% of traffic hits the SchemaLink. Flipping one feature to `'graphql'` is the intended mechanism for cutting a feature over to a real gateway later; both transports execute the same GraphQL documents, so only the routing changes.

The mock schema is a genuine schema+resolver implementation (typos/wrong types fail like a real gateway would), assembled per-feature under `src/graphql/features/<name>/`:
- `schema.ts` — SDL for that feature, merged into `src/graphql/schema.ts`
- `store.ts` — an in-memory array seeded from `src/mocks/<name>.ts`, mutated by resolvers for the session
- `resolvers.ts` — Query/Mutation resolvers (delayed via `mockSession.ts`'s `sleep()`), with wire-shape/enum translation
- `documents.ts` — `gql` queries/mutations
- `hooks.ts` — typed `useQuery`/`useMutation` wrappers screens actually call, doing wire→app shape translation

`mockSession.ts` issues fake bearer tokens and maps them to user ids so `me`/auth-context resolution behaves like a real gateway. `authToken.ts` holds the current bearer token in a module-level variable rather than in Redux, specifically to avoid an import cycle (store → auth slice → client → store); the auth slice pushes into it on login and on `REHYDRATE`.

### Offline queue

`src/graphql/offlineQueue/link.ts` sits ahead of the transport split. If a mutation's context carries a registered `offlineQueueKey` (from `registry.ts`) and `connectivity.ts` (a NetInfo-backed singleton, deliberately the single source of truth for online/offline state) reports offline, the link dispatches into `redux/outbox` instead of calling the real link, synthesizing an optimistic response via the registry entry's `buildOptimisticData()`. `registry.ts` currently covers six create/update mutations (work log entries, fixtures, maintenance requests, incidents, POIs, POI interactions/updates). `flush.ts` replays queued items sequentially — order matters for some (e.g. work log's `nextReference()`) — stopping at the first still-failing item but skipping past already dead-lettered ones (max 5 attempts before dead-lettering, see `redux/outbox/slice.ts`).

### Redux

`rootReducer.ts` combines `auth`, `shift`, `ui`, `outbox`, `maps`, persisted via `redux-persist` to AsyncStorage (`ui` is blacklisted from persistence). `redux/migrations.ts` versions the persisted shape — check it when changing any persisted slice's structure. `redux/outbox` is the state half of the offline queue described above (`items` pending, `failed` dead-lettered); `graphql/offlineQueue/` is the transport/replay half. Logout clears the auth token and calls `apolloClient.clearStore()`.

### Navigation gating

`navigation/AppNavigator.tsx` is a three-way top-level gate driven by auth/shift selectors: **Auth** (not logged in) → **Setup** (logged in, no active shift) → **Main** (logged in + active shift). `MainTabNavigator.tsx` fetches the tab list from a backend-driven menu query (`useGetMenuItemsQuery`) and builds tabs dynamically from `navigation/screens.ts`'s `SCREEN_MAP`, falling back to a "Coming Soon" placeholder for menu entries with no implemented screen yet. `linking.ts` defines a `bbb://` deep-link scheme that is not yet registered natively (inert).

### User roles

`UserRole` (`'ambassador' | 'supervisor'`, `src/types/auth.ts`) lives on `User`/`GqlUser`, threaded from the GraphQL `UserRole` enum (`AMBASSADOR`/`SUPERVISOR`) through `auth/resolvers.ts`'s `toUser()` and `redux/auth/slice.ts`'s `login` thunk (`ROLE_OUT`/`ROLE_IN` maps — same enum-translation convention as `observationReport`'s `TYPE_OUT`/`TYPE_IN`). Supervisor is a superset of ambassador, not a separate account silo — treat a supervisor account as having ambassador-level access plus more, not disjoint capabilities. **Nothing branches on `role` yet**: `MainTabNavigator`'s menu query and every screen currently render identically for both roles. Role-based module/screen gating is being added incrementally as each Supervisor-specific module gets ported from its design mockup. `redux/migrations.ts`'s v5 entry backfills `role: 'ambassador'` for state persisted before this field existed.

### Adding a new feature module

The repo has added many structurally identical modules this way (dispatch, equipment, fixture, incident, maintenance, notification, observationReport, poi, programs, referenceDocument, workItems, workLog). The recipe:

1. `src/types/<name>.ts` — domain types
2. `src/mocks/<name>.ts` — hand-authored fixture array
3. `src/graphql/features/<name>/{schema,store,resolvers,documents,hooks}.ts`
4. Register the feature in `src/graphql/schema.ts`, `src/graphql/mockSchema.ts`, and `src/config/transport.ts` (add to the `Feature` union + `API_TRANSPORT`)
5. `src/screens/<name>/` — `<Name>Navigator.tsx`, `routes.ts`, list/detail screens, `filtering.ts` for client-side search/sort, `components/`
6. Wire into `navigation/screens.ts` (`SCREEN` enum, `TAB_ROOT_ROUTE`, `MainTabParamList`) and `MainTabNavigator.tsx`'s `SCREEN_MAP`
7. If it has creates that should work offline, register the mutation in `graphql/offlineQueue/registry.ts`

### Maps

`GOOGLE_MAPS_API_KEY` (`.env`, gitignored) is used only for the Geocoding/Places Autocomplete/Details APIs — **not** the Maps SDK. iOS renders the map itself natively via MapKit through `react-native-maps`' default provider; do not enable Maps SDK for iOS on the key. `react-native-dotenv` inlines the key into the JS bundle (`safe: false, allowUndefined: true` in `babel.config.js`), so the app must build and run correctly with the key entirely absent — see the keyless fallback in `src/services/maps.ts`. Because the key is bundle-extractable and its endpoints can't be restricted by bundle ID/SHA-1, the only real controls are API restriction (Geocoding + Places Autocomplete + Places Details only) and a daily quota cap, both set in the Google Cloud Console before shipping.

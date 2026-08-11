---
paths: src/screens/notifications/**, src/graphql/features/notification/**, src/mocks/notification.ts, src/types/notification.ts, src/redux/ui/**
---

# Notifications module

- **There is no in-notification detail screen, by design** (owner's
  instruction). The source mockup's `moduleDetailFields()` *fabricates* the
  record it shows — Priority, Address, Zone, and Assigned To all come from
  one hardcoded `addr` constant plus a per-module zone lookup, not real data.
  Don't rebuild it.

- **Tapping a notification deep-links into the owning module** via
  `pendingRecord` / `requestRecord` / `clearPendingRecord` in
  `src/redux/ui/slice.ts` — a second instance of the POI module's
  `pendingCreate` handoff pattern. Five destinations: Maintenance, Incident,
  Fixture, POI (all `{name:'view', id}`) and Work (`{name:'view-worklog',
  id}`).

- **`module` (the badge) and `related.recordType` (the deep-link target) are
  intentionally separate fields.** A Cleaning notification wears a Cleaning
  badge but opens a Work Log entry — don't assume they must match.

- **Seeded notification targets must point at real records in `src/mocks/`**,
  not invented ids. `targetFor()` throws at module load on a miss, and
  message copy is generated from the resolved target, so a notification can
  never reference a record its own tap doesn't open.

- **System and Equipment notifications have `related: null` and do nothing on
  tap, by design** — they just mark read. Equipment has no detail screen in
  this build; System has no backing record. This was flagged to the owner as
  the decision most worth overruling, and they let it stand — raise it again
  before changing it, don't just add a Coming-soon alert.

- **Neither read mutation uses `refetchQueries`**, unlike other modules' write
  mutations. Both select a cache-keyed `id`/`unread` so Apollo normalization
  updates the rows on its own, and marking read is usually the last thing
  before the deep link unmounts every query a refetch would name anyway.

- **Not a tab, not in the More menu.** The Home bell is the only entry point.

---
paths: src/screens/work/**, src/graphql/features/work/**, src/mocks/workItems.ts, src/types/work.ts
---

# Work module

- **Tabs are Assigned / Unassigned / Completed** — Unassigned is
  supervisor-only (`TabSwitcher.tsx`, gated on `role === 'supervisor'`, same
  as Home's `RecentWork` tab list). Each tab has its own category scope,
  computed by `filtering.ts`'s `applyBucketScope` (Work tab) / `applyHomeScope`
  (Home's Recent Work preview) rather than the flat "aggregate everything"
  model this doc used to describe:
  - **Unassigned**: Maintenance only (`item.bucket === 'unassigned'`). No
    Module filter chip — there's nothing to choose between.
  - **Assigned**: Maintenance (`item.bucket === 'assigned'`) mixed with
    *every* Activity (Work Log) item, one category shown at a time via a
    single-select Module chip defaulting to Maintenance. Activity items are
    included regardless of their own `bucket` field — see below.
  - **Completed**: every category with `item.bucket === 'completed'`
    (Maintenance, Incident, Fixture, POI, Activity), same as before, but the
    Module chip is now single-select (`SingleSelectSheet`, not
    `MultiSelectSheet`) and defaults to Activity instead of showing
    everything unfiltered.
  - **Module is tracked per-bucket** (`WorkScreen.tsx`'s `categoryByBucket`
    state, keyed by `WorkBucket`), not as part of the shared `filters`
    object the other chips use. Each bucket is seeded with its own default
    (`defaultCategoryFilter`) but then remembers whatever the user last
    picked for that specific bucket — switching tabs and back does **not**
    reset it. This also sidesteps any "selection invalid for this bucket"
    case (e.g. Fixture doesn't exist as an option on Assigned) since the two
    buckets never share one stored value to begin with.
  - Because Module can never be truly empty on Assigned/Completed (there's
    always exactly one category showing), its chip is passed as
    `FilterChips`'s `nonClearable` — it keeps the chevron affordance instead
    of turning into a removable "✕" the way every other chip does once it
    has a value. Tapping it always reopens the picker, never clears
    anything.

- **Activity (Work Log) items always carry `bucket: 'completed'`**
  (`mocks/workItems.ts`'s `toWorkLogWorkItem` — "self-reported completed
  work, not assignable tasks"), so Assigned's inclusion of Activity is a
  deliberate exception to the bucket field, not a Maintenance-style
  assigned/unassigned/completed lifecycle applied to Activity. A card
  rendered under Assigned+Activity still gets `WorkCard`'s completed-style
  field layout (Business/Quantity, no status-change menu) because `WorkCard`
  itself branches on `item.bucket`, not on which screen tab it's rendered
  under.

- **Home's `RecentWork` widget has its own, stricter scope**
  (`applyHomeScope`), independent of the Work tab's `applyBucketScope`:
  Assigned and Completed both mix only Maintenance + Activity (never
  Fixture/Incident/POI, even on Completed), sorted latest-first
  (`applySort(..., 'latest')`) and capped to 2 items
  (`MAX_VISIBLE`) — there's no Module filter UI on Home, so the scope itself
  decides what's eligible before the recency cap picks the two shown.

- **Status flow reuses Maintenance's inline pill + kebab menu**
  (Open → In-progress → Completed), for interaction consistency with the
  Maintenance module, instead of the source mockup's single implicit
  "mark complete" action.

- **The FAB reuses the existing `AddRequestsSheet`, but every tile currently
  shows a placeholder "Coming soon" alert.** Real Maintenance creation only
  happens through the Maintenance tab's own FAB — don't wire Work's FAB
  tiles to real creation without reconciling that duplication first.

- **Card tap shows a placeholder alert, not a detail screen.** Work items use
  a different id namespace than `src/mocks/maintenance.ts`, so routing
  "Maintenance"-category Work items to `ViewMaintenanceScreen` needs the two
  mock datasets reconciled first — this is unfinished scope, not an
  oversight to silently patch around.

- **`WorkItem.date` is real ISO-8601** (`WorkCard.tsx` formats it for
  display) — the schema comment always claimed this but the mock data didn't
  match until this was fixed; don't assume it needs re-fixing.

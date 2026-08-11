---
paths: src/screens/work/**, src/graphql/features/work/**, src/mocks/workItems.ts, src/types/work.ts
---

# Work module

- **Tabs are Assigned / Completed only**, and both tabs aggregate
  Maintenance, Incident, Fixture, POI, and Activity items together — not
  split by category or by role.

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

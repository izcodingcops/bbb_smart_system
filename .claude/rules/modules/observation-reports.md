---
paths: src/screens/observationReports/**, src/graphql/features/observationReport/**, src/mocks/observationReport.ts, src/types/observationReport.ts
---

# Observation Reports module

- **Read-only, no create flow.** The old app has a full RVP/Supervisor
  "add observation" form (~600 lines), but this module's source mockup
  exports only a read-only list + detail — no create screens. Not reachable
  from `AddRequestsSheet` on any tile. Don't port the old app's create flow
  without a new design decision to do so.

- **Fills the pre-existing `reports` menu row** (`src/mocks/menu.ts` id
  `reports`) — don't add a separate menu entry.

- **Only Zone, Score, and Reviewed By actually filter the list.** Created
  User, Active Users, Deleted Users, and Date Range render as interactive
  chips/sheets but never narrow results — check `FUNCTIONAL_FIELDS` in
  `filtering.ts` before treating an unfiltered chip as a bug. This mirrors
  the source mockup's own `matchFilter`, which has no `createdBy` field
  distinct from `reviewedBy` and no active/deleted employee-status field at
  all.

- **Score buckets keep the mockup's overlapping-boundary quirk verbatim:**
  `0-2` is `score < 2`, `2-3` is `2 ≤ score < 3`, `3-5` is `3 ≤ score ≤ 5` — a
  score of exactly 2 or 3 matches only one bucket, not two. Don't "fix" this
  into even ranges.

- **`checklist` is denormalized per record** (`{question, answer, note}[]`),
  not indexed positionally against a shared question-list constant the way
  the mockup's own JS does.

- **Card `dateLine` must read `report.dateTime`, not `report.date`.**
  `formatCardDate` expects a full datetime; a date-only string parses as UTC
  midnight, which showed cards one day early with a fabricated 8:00 PM time
  (real bug, fixed in `7b94d42`). `date` stays on the type for other
  consumers — only the card display reads `dateTime`. Watch for the same
  trap in any other module's card formatter.

# Ambassador module

- **First role-gated module/tab in the codebase.** Every other Supervisor
  port so far (RVP Site Visit, Off Hours Visit, Shift Notes, Equipment)
  renders identically for both roles — nothing branched on `role` before
  this. `menuItems` in `graphql/features/navigation/resolvers.ts` now reads
  the caller's role off the bearer token (`ctx.token` → `userIdForToken` →
  `MOCK_USERS`) and drops any `MOCK_MENU_ITEMS` id in `SUPERVISOR_ONLY_IDS`
  (currently just `'ambassadors'`) for a non-supervisor. Filtering happens
  server-side in the resolver, not client-side in `MoreSheet`/
  `MainTabNavigator` — since the tab list is already backend-driven
  (`useGetMenuItemsQuery`), an ambassador-role account never even registers
  the `Ambassadors` route, the same as a program whose menu omits a module
  entirely. A no-token (never logged in) request is filtered too, same as an
  ambassador — fail closed, not open.

- **Read-only end to end.** List → Profile → (All Work → work detail) /
  (Past Reports → report detail) — no create, edit or delete anywhere in
  this module. No offline queue entry, no toast param on any route.

- **"All Work" is a self-contained mock, deliberately not joined to the real
  `workLog`/`maintenance` stores.** The app's existing `WorkItem` merge
  (`graphql/features/work/resolvers.ts`) has no assignee filter, mixes in
  Fixture records this module doesn't want, and has no "priority derived
  from points" concept. Building that join would mean touching shared
  modules and matching by free-text name anyway (no real assignee id exists
  anywhere in this app yet) — so `AmbassadorWork` is its own type, its own
  `src/mocks/ambassador.ts` EXPLICIT+GENERATED seed, and its own store,
  independent of `workLogStore`/`maintenanceStore`. An ambassador's real
  entries from the actual Work tab do **not** appear here.

- **"Past Reports" is the opposite call — it reuses the real
  `ObservationReport` store and screen, not a copy.** Observation Reports
  already models exactly this concept (score, reviewer, zone, checklist),
  so `ambassadorReports(ambassadorId)` in
  `graphql/features/ambassador/resolvers.ts` filters
  `observationReportStore.records` by `type === 'Ambassador' && name ===
  <this ambassador's name>` (case-insensitive — see below), and report
  detail navigates straight into `ViewObservationReportScreen` with a new
  `readOnly` prop, not a rebuilt screen. This is the same
  cross-feature-store-read precedent `work/resolvers.ts` already uses for
  Maintenance/WorkLog.

- **`ViewObservationReportScreen` gained an optional `readOnly?: boolean`
  prop** (default `false`, existing `ObservationReportsNavigator` usage
  unchanged). It only suppresses `onEdit`/`onDelete` on `DetailTopBar` — the
  screen still unconditionally calls
  `useObservationReportFormOptionsQuery`/update/delete mutation hooks
  regardless of `readOnly`, since React hooks can't be called conditionally
  from a prop. A report opened read-only from Ambassador is still fully
  editable from its own Observation Reports tab; this only hides those
  actions on this entry point.

- **The name-match to `ObservationReport` is case-insensitive on purpose.**
  One of that store's own scraped-real `EXPLICIT` records (`obr_2024`) has
  `name: 'Arslan saeed'` (lowercase surname) while this module's roster has
  `'Arslan Saeed'`. Per this app's mock convention, scraped records stay as
  scraped rather than being "fixed" — `reportsOf()` in
  `ambassador/resolvers.ts` compares `.trim().toLowerCase()` on both sides
  so the two still link up. Don't normalize the stored record's casing.

- **Three new `EXPLICIT` `ObservationReport` records were added**
  (`obr_1840`/`obr_1810`/`obr_1780`, ids sit below the generated AMB floor
  of 1867 so they never collide) — adapted from the design handoff's own
  `REPORTS` array for its walkthrough ambassador (Arslan Saeed), giving the
  profile's "most recent report" and "Past Reports" a real 4-report history
  instead of just the one pre-existing scraped record. The
  `graphql:smoke` test asserting `observationReports` returns "40 records
  split evenly by type" was updated to 43 (23 Ambassador / 20 Supervisor) —
  if you touch that module's mocks again, re-check that count rather than
  assuming 20/20.

- **Avatars are initials-only** (`PersonChip`), matching every other
  surface in the app — the design mockup shows real photos, but nothing
  else here renders `User.avatar` either. Card is 46px/rounded, profile
  hero is 78px/rounded (the plain `.pv-hero .pv-av`, not RVP's smaller
  56px/16 `.rv-hero` variant — this module doesn't use that variant).

- **`id`/`reference` split, same convention as every other module.**
  `Ambassador.id` is opaque (`amb_27617`), `reference` is what's displayed
  (`#27617`) — the design mockup uses the bare `#27617`-style string as both
  simultaneously; this module doesn't.

- **No fake header count.** The design's `(3,365)` is an illustrative
  directory size unrelated to the ~25 seeded records, same as Reference
  Documents' `(960)`. The appbar shows the real loaded count (matching RVP's
  own precedent of showing a true count, not the mockup's fixed one), and
  `ListSummary` covers the rest.

- **Only Job Title, Points Earned, Status and Badges actually filter the
  roster list; Last Active Date is a cosmetic pass-through** — the design's
  own `matchFilter` falls through for it, same convention as every other
  module's Date Range/Last Active chip. Work's Date Range and Reports'
  Date Range are the same story. Past Reports' "Created User" chip was
  renamed **Reviewed By** — what it actually filters (`r.reviewer`) is this
  app's existing Reviewed By concept, and calling it "Created User" would
  imply the different, cosmetic field the real Observation Reports module
  has under that name, which this data model doesn't have.

- **"Report #" is a free-text filter, not a picklist** — the one field in
  this module (and the only one in the app so far) that needs a plain
  text-input bottom sheet instead of radio/checkbox options. Built as a
  small local `ReportNumberSheet` inside `AmbassadorWorkListScreen.tsx`
  (a `BottomSheet` + `TextInput` + Reset/Apply), not a new shared component —
  no other module needs this shape yet.

- **Maintenance-type work cards always show the profile's own ambassador as
  "Assigned To"**, via a `ambassadorName` prop threaded into
  `AmbassadorWorkCard`, not the design mockup's `createdBy`-string-split
  hack (which produced a different, unrelated name than the detail screen's
  own "Assigned To" field). Card and detail now agree.

- **Badges render the ambassador's full `badges` array**, not just
  `badges[0]`. The design mockup's own profile JS only ever populates the
  first badge into a `.bchips` *container* explicitly styled `flex-wrap` for
  multiple chips — read as a prototype shortcut, not an intentional
  single-badge design, since an ambassador with four badges (e.g. Teeya
  Barnes) would otherwise visibly lose three of them.

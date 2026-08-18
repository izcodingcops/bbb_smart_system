---
paths: src/screens/observationReports/**, src/graphql/features/observationReport/**, src/mocks/observationReport.ts, src/types/observationReport.ts
---

# Observation Reports module

- **Full create/edit/delete, added 2026-08-18 — this module used to be
  read-only.** The original build ported only a read-only list + detail from
  the Ambassador standalone-export mockup (the old app's own
  `supervisorFlow/addObservation` form was deliberately not ported). A later
  Supervisor design handoff (`observation-create.js` in the
  "(Supervisor) Mobile App Design" folder) added a real Add/Edit form, so the
  create flow here follows *that* mockup, not the old app's. If you find a
  reference to this module being "read-only" or "no create flow" anywhere
  (comments, other rule files, memory), it's stale — update it rather than
  trusting it.

- **`answer` on the wire is a plain `String!`, not an enum.** Unlike RVP's
  `RvpAnswerValue` (`YES`/`NO`), `ObservationChecklistItem.answer` and
  `ObservationAnswerInput.answer` are raw strings using this app's own
  title-case values (`'Yes'`/`'No'`), never uppercase. Sending `'YES'` here
  silently matches nothing and stores as `'No'` — the smoke tests caught this
  exact mistake once already; don't copy RVP's enum casing into this module.

- **A missing or unrecognised answer defaults to `'No'`, never `'Yes'`.**
  `buildChecklist` in `resolvers.ts` walks the server's own 5-question tree
  and only stores `'Yes'` when the input explicitly says so — anything else
  (absent key, unknown key, a stray value) becomes `'No'`. This is
  deliberately fail-closed: a request that skips the client's "all five
  answered" gate can't inflate its own score by omission.

- **One `note` per question, reused for two different prompts.** The create
  form's Q5 ("Was a training topic/scenario covered?") reveals a note box on
  a **Yes** asking for the training topic — every other question reveals one
  on a **No** asking why not. Both write to the same
  `ObservationChecklistItem.note`; there is no separate "training topic"
  field. The seed data already relies on this (`obr_2043`'s `checklist[4]`
  carries a topic string under a `Yes`) — `QuestionBlock`'s `revealOnYes`
  prop is what switches the trigger condition and placeholder text, hardcoded
  to question index 4 in `ObservationReportForm`.

- **Online-only, no offline queue entry** — unlike Fixture/Incident/POI,
  whose creates *are* queued. Opening the form needs a live `nextReference`
  and picklists the same way RVP's does (`network-only` fetch), so there is
  no meaningful offline path to queue a create onto in the first place. If
  you reconsider this, remember every other offline-queued create also has a
  `pending<Module>Items.ts` list-projection file — registering the mutation
  without one leaves a queued-while-offline report invisible in the list
  until it syncs.

- **Detail-page checklist answers render plain, on their own line — no
  colored pill.** `ChecklistItem` matches the mockup's `.q-ans` exactly:
  question, then the answer as plain bold text on the next line (same color
  regardless of Yes/No), then a white bordered note box if there's a note.
  The **card**'s summary field stays a plain unboxed line (matches the
  mockup's `.c2-sum`) — only the **detail page**'s Observation Summary
  section gets the white bordered box, matching `.q-note`.

- **A note box's spacing wraps the `TextField` in an outer `View`, never
  merges into its own `style` prop.** `TextField`'s outer `wrap` centers its
  child vertically; a `marginTop` passed through `style` lands on the inner
  `TextInput` itself rather than pushing the whole control down, which reads
  as missing top padding. `QuestionBlock`'s reveal box learned this the hard
  way — copy RVP's `QuestionBlock` shape (`<View style={styles.note}><TextField .../></View>`),
  not a merged style array.

- **`ObservationReportsScreen`'s Ambassador/Supervisor tabs use the shared
  `SegmentedTabs`** (`components/ui`), not a hand-rolled lookalike — a
  `ReportTabSwitcher` component with its own solid-gray (non-glass) styling
  existed here once and was deleted in favor of the shared control every
  other module's tab switcher already uses.

- **The create form's Type toggle uses the shared `IconToggleCards`**
  (`components/ui`), the same icon-card control Maintenance's
  `AssigneeToggle` uses for its assignee picker (`AssigneeToggle` is now a
  thin adapter over it) — not `SegmentedButtons`, which is a different,
  flatter pill control used for questions' Yes/No rows.

- **A generated (not seeded-by-hand) record's `score` must be derived from
  its own `checklist`, never from an unrelated index.** `generate()` in
  `mocks/observationReport.ts` once set `score` from a disconnected
  cyclical array (`[1, 2, 3, 5][i % 4]`) while `checklist` came from a
  *different* cyclical array (`GEN_ANSWER_SETS`) — the two drifted, so
  "Jordan Blake" showed `1.0/5` on the card/detail while the edit form's
  live Yes-count badge (which always derives from the checklist) showed
  `5/5` for the same record (real bug, fixed 2026-08-18). Both must come
  from the same `answers` array. This only affects generated records —
  the 16 hand-authored `EXPLICIT` ones are deliberately left as scraped
  from the real system export, mismatches and all; don't "fix" those without
  being asked.

- **The person being observed is locked on edit.** `ObservationReportForm`
  only renders the Type toggle and Ambassador/Supervisor picker in create
  mode; edit mode shows Type as plain text and the person `DropdownField` as
  `disabled`. The resolver itself does not enforce this — `updateObservationReport`
  just re-stores whatever `name`/`type` it's sent, same as every other write
  here, so this is a client-side rule only (see the smoke test that updates a
  record with the same name/type to confirm the round-trip, rather than
  asserting the resolver rejects a changed one).

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

---
paths: src/mocks/**, src/graphql/features/**, src/screens/**, src/types/**
---

# Data module conventions

Patterns that repeat across every feature module (Fixture, POI, Observation
Reports, Reference Documents, Dispatch, Maintenance, Incident, Work, WorkLog).
Check these before "fixing" something that looks like an inconsistency.

- **`id` and `reference` are distinct, non-swappable values.** `id` is an
  opaque store key (e.g. `'poi_2043'`), never displayed. `reference` is the
  display string (e.g. `'#POI-2043'`), never used for routing or
  `keyExtractor`. Route params, GraphQL query variables, and
  `findRecord(id)` all use `id`; every card and detail screen displays
  `reference`.

- **Mocks follow an `EXPLICIT` + `GENERATED` split**, exported together as
  `MOCK_<NAME>`. `EXPLICIT` ports the mockup's own records verbatim.
  `GENERATED` adds extra records for a realistic list surface, dated relative
  to *today* — never copy the mockup's fixed source dates, they go stale the
  day after the module ships.

- **Filter chips port the mockup's own `matchFilter` logic literally,
  including chips that render and are interactive but never actually narrow
  the list.** If a chip's filter field doesn't exist as real, per-record data
  in this app (e.g. no `createdBy` distinct from `reviewedBy`, no
  active/deleted employee status), leave it cosmetic rather than inventing
  filtering logic the source design never specified. Check the module's own
  `filtering.ts` `FUNCTIONAL_FIELDS` (or equivalent) before assuming an
  unfiltered chip is a bug.

- **A module with no create screen in its mockup export gets no create
  screen here.** Several modules (Observation Reports, Reference Documents,
  Notifications, Maps) are intentionally read-only archives because their
  standalone-export mockup only built a list + detail view, even when the
  old app (`bbb_mobile_application`) has a fuller create flow. Don't port the
  old app's create flow without a design/spec decision to do so.

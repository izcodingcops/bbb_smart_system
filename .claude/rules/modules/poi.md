---
paths: src/screens/poi/**, src/graphql/features/poi/**, src/mocks/poi.ts, src/types/poi.ts
---

# POI module

- **The Person create form has no Location section, by design.** The source
  mockup defines `personLocationSection()` but never calls it, and the old
  app's `person/create` body carries no address or zone either. `address`/
  `zone` are stamped server-side; `describeLocation` is never collected and
  is `null` on every app-created record. Don't add this section back as a
  "missing field" fix.

- **`interactionCount` is derived, not stored.** `toWire` computes it as
  `interactions.length` — there is no standalone counter to keep in sync.

- **Interactions and Updates are append-only.** No edit/delete mutations
  exist for either, matching the old app, which has no such endpoints.

- **The `poi` Add Requests tile routes straight to Create Person**, same as
  every other module's tile — no chooser. Person is the only record type
  reachable from that sheet; Interaction and Update stay reachable only from
  a person's card (`Add Interaction`/`Add Update`) or their detail screen.
  (An earlier build had a three-way "What do you want to create?" chooser
  sheet here — `PoiChoiceSheet` — since removed; don't reintroduce it without
  a design ask, since it wasn't in the source mockup to begin with.)

- **Height/weight/age are free text here but dropdowns in the old app**
  (`person/heightDropdown` etc.). Flag this as a validation risk if/when this
  feature moves off the mock transport onto a real gateway — don't silently
  convert to dropdowns without checking whether that's still wanted.

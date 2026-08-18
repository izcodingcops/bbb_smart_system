---
paths: src/screens/offHoursVisit/**, src/graphql/features/offHoursVisit/**, src/mocks/offHoursVisit.ts, src/types/offHoursVisit.ts
---

# Off Hours Visit module

- **A create flow with no read surface — the inverse of every other module.**
  The design says it outright: submit-only, reports read back on the portal.
  There is no list query, no detail query, no edit and no delete. The tab
  root is an empty state that says so. Don't pattern-match Incident here, and
  don't "add the missing list" — its absence *is* the design.

- **Its own `off_hours` menu row.** Unlike Observation Reports and Reference
  Documents there was no placeholder row to fill, so `src/mocks/menu.ts`
  gained a new one.

- **The question set is served, not a client constant.**
  `offHoursVisitFormOptions.questions` carries each prompt, its option labels
  *and their points*, the hint, the reveal rule and the numeric flag. The
  design hardcodes all of it in JS; here the checklist and its scoring can
  change without an app release.

- **Scoring is recomputed server-side and `ratingMax` is derived.** The form
  sums points live for the top-bar badge, but the resolver rescores from its
  own option table, so a client cannot inflate a stored score. `ratingMax` is
  summed from the question set, never the literal 20 — add a sixth question
  and the denominator moves on its own.

- **Q5 is scored in reverse.** More safety violations is a worse score, so its
  label `'1'` is worth **3** points. A build that reads the label as the score
  scores the design's own filled-in form 12 instead of 14; the smoke check
  pins exactly that.

- **`isNoteVisible` (exported from the feature's `hooks.ts`) is the single
  definition of the reveal rule**, used by both the form (whether to render
  the description box) and the wire mapper (whether to send what's in it).
  Hiding the box deliberately leaves the typed text in form state, so
  No → Yes → No shows it again rather than blanking it; the mapper is what
  stops a hidden note reaching the store. Change the predicate, never one
  caller.

- **Online-only, no offline queue entry.** With no in-app list a queued report
  is invisible until it flushes, and a dead-letter would silently discard the
  whole form, since nothing surfaces `outbox.failed`. Accepted cost: no signal
  means no filing. Don't "fix" this by registering the mutation.

- **The success toast has no View action.** `OffHoursVisitToast` deliberately
  carries no `routeId`, unlike every sibling module's toast type — there is
  nowhere in the app to view a submitted visit.

- **A successful submit returns to `origin`, not this tab's empty state.**
  Unlike every other module, there's no reason to strand the user on
  `OffHoursVisitList` after creating — the toast has no View action to tap,
  so the "stay to see the new record" rationale that keeps Maintenance/Fixture/etc.
  on their own tab doesn't apply here. `OffHoursVisitNavigator`'s `onCreated`
  mirrors `onClose`: when `origin` is set it dispatches `showGlobalToast`
  (`redux/ui/slice.ts`) and jumps straight back to `origin` instead of
  rendering the empty state at all. The global toast exists specifically for
  this — a route-param toast tied to `OffHoursVisitList` would unmount the
  instant the tab switches, so this is the one case in the app that doesn't
  use the local per-screen `Toast` pattern. With no `origin` (create opened
  from this tab's own button), landing back on the empty state is correct —
  that genuinely is the previous screen — so the local route-param toast
  still handles that path.

- **`SegmentedButtons`' `wrap` exists for this module's Q1.** The design's
  option pills *are* that component down to the border width and the tick;
  only the row differs (`.optrow` wraps, `.optrow.num` doesn't). Prose labels
  like "Less than 25%" get crushed by the default equal-width row. `wrap` is
  driven by the question's own `numeric` flag.

- **`RatingBadge` is module-local on purpose.** RVP Site Visit scores the same
  way over 74 questions; promote it to `components/ui/` when it becomes the
  second consumer, not before.

- **`extend type` cannot carry a `"""description"""`.** The parser rejects it
  and the whole merged SDL dies at `makeExecutableSchema`, not just this
  feature. Use a `#` comment on type extensions. (Field and enum-value
  descriptions inside a normal definition are fine.)

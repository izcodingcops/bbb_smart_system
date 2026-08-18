# RVP Site Visit module

- **Full surface, unlike the other Supervisor ports.** List, tabbed detail,
  create, edit-in-place and delete — 74 required Yes/No questions across 10
  sections. Off Hours Visit and Shift Notes are submit-only; this one isn't.

- **One derived score pair, not the handoff's two.** The source gives each
  record both a `score` and an `avg` with nothing explaining the difference.
  Here `score`/`scoreMax` is the Yes-count out of 74 (form badge, detail hero,
  section pills) and `avgScore` is `score / scoreMax x 5` to one decimal (list
  card, Score filter buckets). **All four are recomputed in the resolver on
  every read** — a client cannot inflate any of them, and the mutations write
  them only to keep the stored record self-consistent.

- **`isComplete` is derived, never stored as a flag.** A record is incomplete
  only because questions are absent from its answer tree. `buildSections` in
  the mocks takes an explicit `unanswered` count and allocates the No answers
  from the dropped tail inward, so dropping them can't move the score away from
  the average the design states; the invariant throws at module load.

- **The answer enum sits three levels down** (section -> group -> answer), so
  `toWire`/`toApp` must recurse. A top-level-only mapper type-checks and then
  serves `'Yes'` where the SDL promised `YES`. The detail smoke check asserts
  the mapped depth for exactly that reason.

- **`RVP_PROGRAMS` is not `MOCK_PROGRAMS`.** The latter is the program-switcher
  roster (which program you are clocked into); an RVP's `program` is the site
  being visited, a different axis. The create form's default in the handoff
  (`Louisville KY Training BBB 0000`) appears nowhere in its own 16-program
  filter list — the list's `...BID 1000` spelling is the one kept, or two
  records would never match their own filter.

- **The leader position comes from the manager roster server-side.** The create
  form asks for an Operation Manager but never for a position, while the list
  filters on one. `rvpLeaderPositionFor` resolves it; the client never sends it.

- **Submit deliberately does not require every section.** The design's own
  dialog offers "You can submit now and finish later" and names what is
  missing — a site visit is filed over days. Only Basic Details gates the
  button. Don't "fix" this into a full-completion gate.

- **A section opens as a full-screen overlay inside the form, not a nested
  BottomSheet.** That primitive is built for filter and select lists; an
  18-question form with textareas and image pickers inside one fights the iOS
  keyboard. The form owns all answer state, so closing and reopening a section
  keeps what was typed. **`SectionEditor`'s `onChange` takes an updater, not the
  next value** — closing over `values` gave the per-question handlers a new
  identity on every keystroke and made `QuestionBlock`'s memo inert across 18
  blocks.

- **Only Program, Reviewer, Leader Position and Score narrow the list.** Date
  Range renders, opens and holds a selection but never filters — the handoff's
  own `matchFilter` falls through for it. See `FUNCTIONAL_FIELDS`.

- **Score buckets keep the overlapping-boundary quirk**, same as Observation
  Reports: `0-2` is `< 2`, `2-3` is `2 <= s < 3`, `3-5` is `3 <= s <= 5`.

- **Reviewer options are `Last , First` with the source's spacing**; records are
  `First Last`. `flipName` in `filtering.ts` bridges them. The spacing is what
  the sheet displays — don't normalise it.

- **The list card is 3 x 2, not one row.** `RecordCard`'s field grid is a single
  row of equal columns with no wrap, so six fields in `fields` crush every date
  and name to an ellipsis. The cells split across `fields` and
  `secondaryFields`, which renders the design's two rows of three. The card's
  header uses `RecordCard`'s `subtitle` (name over program, 12px gap per
  `.c2-idwrap`), not `dateLine`.

- **The list card's Score cell is a plain star and number, not `ScorePill`.**
  The handoff defines a tinted `scoreCls` helper but never calls it. The tinted
  0-5 pill belongs to Observation Reports; RVP's section pills are tinted by
  **ratio** instead, because a section is graded against its own question count
  (3 to 18).

- **Avatars: card 46px / radius 14, hero 56px / radius 16, chips are circles.**
  Read from the handoff's own stylesheet (`.c2-av`, `.rvh-av`, `.c2-pav`).
  `PersonChip` takes a pixel size and a shape.

- **Its own More-menu row** (`rvp_site_visit`) — Observation Reports already
  occupies the `reports` slot, so unlike that module there was no placeholder
  to fill.

- **Online-only, no offline queue entry.** A 74-question payload doesn't fit the
  registry's thin `buildOptimisticData` shell, and a dead-lettered report would
  silently discard an afternoon of fieldwork.

- **The Ambassador Interaction section is drafted, not transcribed.** The source
  states outright that no screenshot was supplied and its five questions follow
  the other sections' pattern. It is the one section whose wording is the
  designer's rather than the customer's.

---
name: module-from-mockup
description: Use when asked to implement, port or build a module in bbb_smart_system from a Standalone Export HTML mockup in ~/Downloads/BBB/Ambassador — including phrasings like "implement the X module", "do it like maintenance/fixture", or "use superpowers" alongside one of those files.
---

# Module From Mockup

Building a screen module in `bbb_smart_system` from an Ambassador Standalone Export.
Work/Maintenance/Fixture/Dispatch were all built this way; a new module is a port
of that shape, not a new design.

## Non-negotiables

- **No tests, no test runner.** The owner has ruled them out. `scripts/graphqlSmoke.ts`
  is the only harness. Gates are `npx tsc --noEmit`, `npm run lint`,
  `npm run graphql:smoke`, `npm run migration:smoke`.
- **Commits are code-only.** No `Co-Authored-By`, no Claude/Anthropic mention, never
  `git add` a `.md`, always explicit paths. `docs/superpowers/{specs,plans}/` and
  `.superpowers/` are gitignored and stay uncommitted.
- **Never boot the iOS Simulator to self-verify.** The owner does the visual pass.
- **Branch off `main` first.** Run `git status` — do not assume you are on `main`. A
  previous module's branch may still be unmerged, and building on top of it silently
  couples the two.
- **A new module needs an approved spec before any code**, even when the request says
  "and implement it". That phrasing is not pre-authorization to skip review.

## Extracting the design

The export is a self-unpacking bundle — the real source is base64+gzip inside
`<script type="__bundler/manifest">` (a UUID → `{mime, compressed, data}` map),
referenced by UUID from `<script type="__bundler/template">`. Do not try to read
the HTML directly, and do not open it in a browser to guess at the design.

```python
import re, json, base64, gzip
s = open(PATH, encoding='utf-8', errors='replace').read()
d = json.loads(re.search(r'<script type="__bundler/manifest">(.*?)</script>', s, re.S).group(1))
for k, v in d.items():
    if v['mime'] == 'application/javascript':
        open(f'{k[:8]}.js','wb').write(gzip.decompress(base64.b64decode(v['data'])))
```

You get 1–3 commented JS builders (list / create / view) holding the real mock
records, filter and sort options, field lists and section order. **Read them in
full** — the field-level detail is the spec's raw material. Write them to the
scratchpad, never into the repo.

## Pipeline

`brainstorming` → spec at `docs/superpowers/specs/YYYY-MM-DD-<module>-design.md` →
**user approves** → `writing-plans` → plan at `docs/superpowers/plans/` →
`subagent-driven-development`.

Copy the section shape of the most recent spec and plan rather than inventing one.
Keep a ledger at `.superpowers/sdd/progress.md`; check it before dispatching anything
after a compaction.

## Module anatomy

Mirror `src/graphql/features/fixture/` and `src/screens/fixture/` exactly.

| Piece | Path |
|---|---|
| Types | `src/types/<mod>.ts` |
| Mocks | `src/mocks/<mod>.ts` (mockup records verbatim + generated extras) |
| GraphQL feature | `src/graphql/features/<mod>/{schema,store,resolvers,documents,hooks}.ts` |
| Screens | `src/screens/<mod>/{filtering.ts,<Mod>Screen.tsx,View<Mod>Screen.tsx,components/}` |
| Registration | `src/config/transport.ts`, `src/graphql/schema.ts`, `src/graphql/mockSchema.ts`, `src/graphql/cache.ts` |
| Navigation | `src/navigation/MainTabNavigator.tsx` `SCREEN_MAP` (the `src/mocks/menu.ts` entry usually already exists) |

Compose `src/components/ui/` primitives — check the barrel before building anything.
Hooks return `{data, isLoading, isError, refetch}`; `context: {feature: '<mod>'}` goes
in one constant at the top of `hooks.ts`.

**Entry points are plural.** `SCREEN_MAP` is not the only one: every `AddRequestsSheet`
consumer handles its own tile `onSelect` with a local "Coming soon" fallback. Run
`grep -rln AddRequestsSheet src/screens/` — currently five screens — and decide per
screen whether the new module's tile routes anywhere. Precedent is that a module's
real create flow lives only behind its own tab, so leaving them all as "Coming soon"
is a legitimate, and usually the right, answer — but it is a decision to record in the
spec, not an oversight to discover later.

**Check for a shadow implementation first.** `grep -ri <module> src/` before writing
the spec. A sibling module may already carry a narrow projection of the type you are
about to make canonical — Dispatch shipped `DispatchIncident`, `IncidentAccordion` and
`IncidentDetailSheet` before the Incident module existed, with a comment inviting
reconciliation. Whether the new module absorbs, replaces or ignores that projection is
a design fork that belongs in the spec's Decisions section.

## Traps that have actually shipped bugs here

| Trap | Check |
|---|---|
| `id`/`reference` swap — both `string`, compiler blind | Display sites read `reference`; `keyExtractor`, route params, query variables read `id`. Give mocks visibly different values. |
| `React.memo` inert | Every callback reaching a memoized card is `useCallback`-stable, and query hooks `useMemo` their mapped array. |
| Detail screen traps the user | Routes hiding the tab bar must render the back affordance in **loading, error and loaded** — there is no `BackHandler` anywhere. |
| Hook order | All hooks precede every early return. |
| Nested enums | `toWire` must uppercase enums on nested objects too, not just the top level. |
| Nullable SDL arrays | A field the SDL declares nullable must be coalesced at the mapper. The mock always populates; a real gateway will not. |
| **Stale mock dates** | Shipped twice. Check the newest seeded date against **today** and confirm every Date Range bucket is non-empty. |
| **Smoke assumed green** | Shipped twice. Run `npm run graphql:smoke` on the **base commit** before trusting it — assertions go stale silently and `assert` throws on first failure, so each repair uncovers the next. |

## Before dispatching Task 1

Scan the plan for anything it mandates that a reviewer would flag as a defect —
duplicated style blocks are the recurring one. Fix the plan, then start.

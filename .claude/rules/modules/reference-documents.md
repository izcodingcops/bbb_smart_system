---
paths: src/screens/referenceDocuments/**, src/graphql/features/referenceDocument/**, src/mocks/referenceDocument.ts, src/types/referenceDocument.ts
---

# Reference Documents module

- **Fills the pre-existing `reference_documents` menu slot**
  (`src/mocks/menu.ts` id `reference_documents`, already mapped to
  `FileTextIcon` in `MoreSheet.tsx`) — don't add a new menu entry.

- **Read-only, no create flow** — the source mockup's single JS builder has
  no create screen at all.

- **`status` is always `"Completed"` and `"Cleaning"` is a hardcoded module
  label, not per-record data.** Both come straight from the mockup's own
  markup (`card2-mod`, `vf('Type of Request','Cleaning')`), not derived
  fields — don't add a status enum or a `type` field expecting variation.

- **Only Entry Type, Business Name, and Zone actually filter the list.**
  Date Range renders as an interactive chip but is a cosmetic pass-through in
  the mockup's own `matchFilter` — check `FUNCTIONAL_FIELDS` in
  `filtering.ts` before treating it as a bug.

- **Don't add a header count badge.** The mockup's `(960)` figure is
  explicitly commented as an "illustrative archive size" in its own source,
  divorced from the real seeded record count. `ListSummary`'s real count
  already covers this, same as every other module.

- **Entry Type, Business Name and Zone are served by `referenceDocumentFilterOptions`,
  not hardcoded constants** — a query that exists purely for this module's
  filter sheet, deriving all three arrays from `referenceDocumentStore.records`
  at resolve time (deduplicated, sorted) so they can never drift from what the
  seeded records actually carry. Named `ReferenceDocumentFilterOptions`, not
  `...FormOptions` like every other module's — this module has no create form
  to name a "form options" query after. For the same reason,
  `useReferenceDocumentFilterOptionsQuery()` takes no `fetchPolicy` parameter:
  it has exactly one consumer (the list screen), so `'cache-first'` is
  hardcoded in the hook rather than exposed as a caller choice. If another
  read-only, create-form-less module needs the same treatment, this is the
  pattern to copy — including deriving from the store rather than adding a
  new hand-maintained list.

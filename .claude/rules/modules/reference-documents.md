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

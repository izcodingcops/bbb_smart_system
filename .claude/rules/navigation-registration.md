---
paths: src/navigation/**, src/components/MoreSheet.tsx
---

# Navigation registration

- **New tab/screen registration is three edits in `src/navigation/screens.ts`**
  (`SCREEN` enum entry, `MainTabParamList` entry, `TAB_ROOT_ROUTE` entry) plus
  wiring the screen's navigator into `MainTabNavigator.tsx`'s `SCREEN_MAP`.
  Tabs are built dynamically from the backend-driven menu query
  (`useGetMenuItemsQuery`), not hardcoded — a menu entry with no
  `SCREEN_MAP` match falls through to `ComingSoonTab`.

- **There are two separate `ICON_MAP`s — don't edit the wrong one.**
  `MainTabNavigator.tsx`'s `ICON_MAP` (line ~83) only covers the five fixed
  bottom-row tabs (home/work/maintenance/fixture/incident). Everything
  reached through the More sheet (Reports, Reference Documents, Notifications
  settings, etc.) uses `MoreSheet.tsx`'s own `ICON_MAP`, keyed by the menu
  item's `menu_icon` string, with `BoxIcon` as its fallback. Adding a
  More-menu-only screen never needs the `MainTabNavigator` map.

- **`linking.ts`'s `bbb://` deep-link scheme is not registered natively** —
  it's inert. Don't assume adding a route there makes it reachable from an
  actual OS-level link without also doing the native (iOS/Android) URL
  scheme registration.

- **`navigateToTarget` / `CREATE_TARGET_BY_TILE` in `screens.ts`** is the
  shared cross-tab navigation helper used by both `AddRequestsSheet` (create
  flows) and Notifications' deep-link handoff (`pendingRecord` in
  `redux/ui/slice.ts`) — a new create-flow tile and a new notification
  destination for the same module should usually resolve to the same target,
  not two separately-maintained routing tables.

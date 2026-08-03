/** Screen names as the menu reports them — the keys MainTabNavigator maps. */
export const SCREEN = {
  home: 'Home',
  work: 'Work',
  maintenance: 'Maintenance',
  fixture: 'Fixture',
  dispatch: 'Dispatch',
} as const;

/**
 * Which Add Requests tiles can actually open a create flow, and the tab that
 * owns it. Create screens are local route state inside their module's screen,
 * so opening one from another tab means switching tabs first — see the
 * `pendingCreate` handoff in the ui slice.
 *
 * Tiles missing from this map have no create screen yet and stay "Coming soon".
 */
export const CREATE_TARGET_BY_TILE: Record<string, string> = {
  maintenance: SCREEN.maintenance,
  fixture: SCREEN.fixture,
  work_log: SCREEN.work,
};

export const createTargetForTile = (tileId: string): string | null =>
  CREATE_TARGET_BY_TILE[tileId] ?? null;

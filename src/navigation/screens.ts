import {NavigatorScreenParams} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {FixtureStackParamList} from '../screens/fixture/routes';
import {MaintenanceStackParamList} from '../screens/maintenance/routes';
import {IncidentStackParamList} from '../screens/incident/routes';
import {WorkStackParamList} from '../screens/work/routes';
import {PoiStackParamList} from '../screens/poi/routes';
import {DispatchStackParamList} from '../screens/dispatch/routes';
import {MapsStackParamList} from '../screens/maps/routes';
import {HomeStackParamList} from '../screens/home/routes';

/** Screen names as the menu reports them — the keys MainTabNavigator maps. */
export const SCREEN = {
  home: 'Home',
  work: 'Work',
  maintenance: 'Maintenance',
  fixture: 'Fixture',
  incident: 'Incidents',
  dispatch: 'Dispatch',
  maps: 'Maps',
  poi: 'Poi',
} as const;

/**
 * The tab routes this build ships a screen for, keyed by the `screen_name` the
 * backend menu reports.
 *
 * Which of these are actually registered depends on the menu — a program whose
 * menu omits Dispatch never mounts that tab. The names and param shapes are
 * fixed either way, so this stays accurate. MainTabNavigator also registers
 * menu entries with no screen as placeholder routes; those are deliberately
 * absent here since nothing navigates to them with params.
 */
export type MainTabParamList = {
  [SCREEN.home]: NavigatorScreenParams<HomeStackParamList> | undefined;
  [SCREEN.work]: NavigatorScreenParams<WorkStackParamList> | undefined;
  [SCREEN.maintenance]:
    | NavigatorScreenParams<MaintenanceStackParamList>
    | undefined;
  [SCREEN.fixture]: NavigatorScreenParams<FixtureStackParamList> | undefined;
  [SCREEN.incident]: NavigatorScreenParams<IncidentStackParamList> | undefined;
  [SCREEN.dispatch]: NavigatorScreenParams<DispatchStackParamList> | undefined;
  [SCREEN.maps]: NavigatorScreenParams<MapsStackParamList> | undefined;
  [SCREEN.poi]: NavigatorScreenParams<PoiStackParamList> | undefined;
};

export type TabNavigation = BottomTabNavigationProp<MainTabParamList>;

/**
 * A destination in another tab: the tab route, plus the route inside that
 * tab's own stack. Both halves are needed because every module's create and
 * detail screens live in its stack, not at the tab level.
 */
export interface ModuleTarget {
  tab: keyof MainTabParamList;
  screen: string;
}

/**
 * Which Add Requests tiles can actually open a create flow, and where.
 *
 * Tiles missing from this map have no create screen yet and stay "Coming soon".
 */
export const CREATE_TARGET_BY_TILE: Record<string, ModuleTarget> = {
  maintenance: {tab: SCREEN.maintenance, screen: 'MaintenanceCreate'},
  fixture: {tab: SCREEN.fixture, screen: 'FixtureCreate'},
  incident: {tab: SCREEN.incident, screen: 'IncidentCreate'},
  // POI has three record types. From another tab this goes straight to Create
  // Person — a full-screen form covers the tab switch. Tapped from the POI tab
  // itself it opens a three-way chooser instead; PoiScreen supplies that as the
  // same-tab override, because a bottom sheet would leave the POI list in full
  // view behind it and read as a teleport.
  poi: {tab: SCREEN.poi, screen: 'PoiCreatePerson'},
  work_log: {tab: SCREEN.work, screen: 'WorkLogCreate'},
};

export const createTargetForTile = (tileId: string): ModuleTarget | null =>
  CREATE_TARGET_BY_TILE[tileId] ?? null;

/**
 * Switches tabs and opens a route inside that tab's stack in one go.
 *
 * The tab name is checked, but which stack it hosts — and therefore which
 * screen names and params are valid — differs per tab, so TypeScript can't
 * verify the inner half against a union of eight param lists. That cast lives
 * here once instead of at every call site.
 */
export function navigateToTarget(
  navigation: TabNavigation | undefined,
  target: ModuleTarget,
  params?: Record<string, unknown>,
): void {
  navigation?.navigate(target.tab, {
    screen: target.screen,
    params,
  } as never);
}

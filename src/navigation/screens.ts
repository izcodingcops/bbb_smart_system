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
import {ObservationReportsStackParamList} from '../screens/observationReports/routes';
import {ReferenceDocumentsStackParamList} from '../screens/referenceDocuments/routes';
import {EquipmentStackParamList} from '../screens/equipment/routes';
import {RvpSiteVisitStackParamList} from '../screens/rvpSiteVisit/routes';
import {OffHoursVisitStackParamList} from '../screens/offHoursVisit/routes';
import {ShiftNotesStackParamList} from '../screens/shiftNotes/routes';

/** Screen names as the menu reports them — the keys MainTabNavigator maps. */
export const SCREEN = {
  home: 'Home',
  work: 'Work',
  maintenance: 'Maintenance',
  fixture: 'Fixture',
  incident: 'Incidents',
  dispatch: 'Dispatch',
  equipment: 'Equipment',
  maps: 'Maps',
  poi: 'Poi',
  reports: 'Reports',
  referenceDocuments: 'ReferenceDocuments',
  rvpSiteVisit: 'RvpSiteVisit',
  offHoursVisit: 'OffHoursVisit',
  shiftNotes: 'ShiftNotes',
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
  [SCREEN.equipment]:
    | NavigatorScreenParams<EquipmentStackParamList>
    | undefined;
  [SCREEN.maps]: NavigatorScreenParams<MapsStackParamList> | undefined;
  [SCREEN.poi]: NavigatorScreenParams<PoiStackParamList> | undefined;
  [SCREEN.reports]:
    | NavigatorScreenParams<ObservationReportsStackParamList>
    | undefined;
  [SCREEN.referenceDocuments]:
    | NavigatorScreenParams<ReferenceDocumentsStackParamList>
    | undefined;
  [SCREEN.rvpSiteVisit]:
    | NavigatorScreenParams<RvpSiteVisitStackParamList>
  [SCREEN.offHoursVisit]:
    | NavigatorScreenParams<OffHoursVisitStackParamList>
    | undefined;
  [SCREEN.shiftNotes]: NavigatorScreenParams<ShiftNotesStackParamList> | undefined;
};

export type TabNavigation = BottomTabNavigationProp<MainTabParamList>;

/**
 * The first route in each tab's stack — the one that keeps the tab bar. Every
 * route above it is a full-screen create or detail that hides the bar.
 *
 * Listed explicitly rather than inferred from the stack's index, because a tab
 * the user has not visited yet has no navigator state to read an index from —
 * see the tab-bar visibility check in MainTabNavigator.
 */
export const TAB_ROOT_ROUTE: Record<string, string> = {
  [SCREEN.home]: 'HomeMain',
  [SCREEN.work]: 'WorkList',
  [SCREEN.maintenance]: 'MaintenanceList',
  [SCREEN.fixture]: 'FixtureList',
  [SCREEN.incident]: 'IncidentList',
  [SCREEN.dispatch]: 'DispatchList',
  [SCREEN.equipment]: 'EquipmentList',
  [SCREEN.maps]: 'MapsList',
  [SCREEN.poi]: 'PoiList',
  [SCREEN.reports]: 'ObservationReportsList',
  [SCREEN.referenceDocuments]: 'ReferenceDocumentsList',
  [SCREEN.rvpSiteVisit]: 'RvpSiteVisitList',
  [SCREEN.offHoursVisit]: 'OffHoursVisitList',
  [SCREEN.shiftNotes]: 'ShiftNotesList',
};

/**
 * A destination in another tab: the tab route, plus the route inside that
 * tab's own stack. Both halves are needed because every module's create and
 * detail screens live in its stack, not at the tab level.
 */
export interface ModuleTarget {
  tab: keyof MainTabParamList;
  screen: string;
  /** Fixed params the destination always needs, merged under the caller's. */
  params?: Record<string, unknown>;
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
  // The one tile that doesn't open a create screen. POI has three record types
  // and the user picks which — so this lands on the POI list and asks the
  // chooser to open over it, wherever the tile was tapped from.
  poi: {tab: SCREEN.poi, screen: 'PoiList', params: {openChooser: true}},
  work_log: {tab: SCREEN.work, screen: 'WorkLogCreate'},
  // The only route to Add Equipment: the Equipment hub's own FAB opens the
  // shared Add Requests sheet rather than a module-local create action, so
  // without this entry the screen is unreachable from anywhere.
  equipment: {tab: SCREEN.equipment, screen: 'EquipmentCreate'},
  // Both report modules are submit-only and their tab roots are empty states,
  // so the sheet tile is the main way anyone reaches either form. The third
  // "Add New Reports" tile stays unrouted: Observation Reports is a
  // deliberately read-only archive with no create flow to route to.
  rvp_site_visit: {tab: SCREEN.rvpSiteVisit, screen: 'RvpSiteVisitCreate'},
  off_hours: {tab: SCREEN.offHoursVisit, screen: 'OffHoursVisitCreate'},
  // Same shape as off_hours: submit-only, so its tab root is an empty state and
  // the sheet tile is the main way anyone reaches the form.
  shift_notes: {tab: SCREEN.shiftNotes, screen: 'ShiftNotesCreate'},
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
    params: {...target.params, ...params},
  } as never);
}

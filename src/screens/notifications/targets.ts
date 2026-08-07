import {ModuleTarget, SCREEN} from '../../navigation/screens';
import {NotificationRecordType} from '../../types/notification';

/**
 * The single place a notification's record type becomes a destination. Every
 * detail screen lives inside its module's own stack, so opening one from
 * Notifications means naming both the tab and the route within it.
 *
 * A record type absent from this map has no detail screen and therefore never
 * appears in a notification's `related` at all; the seed leaves those null.
 */
export const TARGET_BY_RECORD_TYPE: Record<
  NotificationRecordType,
  ModuleTarget
> = {
  Maintenance: {tab: SCREEN.maintenance, screen: 'MaintenanceView'},
  Incident: {tab: SCREEN.incident, screen: 'IncidentView'},
  Fixture: {tab: SCREEN.fixture, screen: 'FixtureView'},
  Poi: {tab: SCREEN.poi, screen: 'PoiView'},
  // Work Log detail lives on the Work tab, not a tab of its own.
  WorkLog: {tab: SCREEN.work, screen: 'WorkLogView'},
};

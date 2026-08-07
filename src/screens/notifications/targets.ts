import {SCREEN} from '../../navigation/screens';
import {NotificationRecordType} from '../../types/notification';

/**
 * The single place a notification's record type becomes a tab. Every detail
 * screen is local route state inside its own module's screen, so opening one
 * from Notifications means switching tabs first — see the `pendingRecord`
 * handoff in the ui slice.
 *
 * A record type absent from this map has no detail screen and therefore never
 * appears in a notification's `related` at all; the seed leaves those null.
 */
export const SCREEN_BY_RECORD_TYPE: Record<NotificationRecordType, string> = {
  Maintenance: SCREEN.maintenance,
  Incident: SCREEN.incident,
  Fixture: SCREEN.fixture,
  Poi: SCREEN.poi,
  // Work Log detail lives on the Work tab, not a tab of its own.
  WorkLog: SCREEN.work,
};

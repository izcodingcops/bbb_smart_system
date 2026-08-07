/**
 * Route table for the Maintenance tab's stack. Kept in its own file so the
 * list screen can import the param list without importing the navigator that
 * renders it.
 */

/** Toast handed back to the list when a create or delete finishes. */
export interface MaintenanceToast {
  title: string;
  message: string;
  /** Record id used by the toast's View action. Empty when there is nowhere to go. */
  routeId: string;
  variant?: 'success' | 'danger';
}

export type MaintenanceStackParamList = {
  MaintenanceList: {toast?: MaintenanceToast} | undefined;
  /**
   * `origin` is the tab the create was asked for from, so closing it unsaved
   * can go back there — the trip into this module never really happened.
   */
  MaintenanceCreate: {origin?: string} | undefined;
  MaintenanceView: {id: string};
};

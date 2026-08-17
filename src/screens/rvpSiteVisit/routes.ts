/**
 * Route table for the RVP Site Visit tab's stack. Kept in its own file so the
 * list screen can import the param list without importing the navigator that
 * renders it.
 */

/**
 * Toast handed back to the list when an update or delete finishes.
 *
 * Create hands one back on submit, and View on delete.
 */
export interface RvpSiteVisitToast {
  title: string;
  message: string;
  /** Record id used by the toast's View action. Empty when there is nowhere to go. */
  routeId: string;
  variant?: 'success' | 'danger';
}

export type RvpSiteVisitStackParamList = {
  RvpSiteVisitList: {toast?: RvpSiteVisitToast} | undefined;
  RvpSiteVisitView: {id: string};
  /**
   * `origin` is the tab the create was asked for from, so closing it unsaved
   * can go back there — the trip into this module never really happened.
   */
  RvpSiteVisitCreate: {origin?: string} | undefined;
};

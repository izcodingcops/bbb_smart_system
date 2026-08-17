/**
 * Route table for the RVP Site Visit tab's stack. Kept in its own file so the
 * list screen can import the param list without importing the navigator that
 * renders it.
 */

/**
 * Toast handed back to the list when an update or delete finishes.
 *
 * Declared now because the list route's params reference it. Nothing produces
 * one until the create/edit/delete flows land — but the param has to exist and
 * be consumed from the start, or the guard that clears it gets added later as
 * an afterthought.
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
};

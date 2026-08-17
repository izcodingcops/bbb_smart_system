/**
 * Route table for the Off Hours Visit tab's stack. Kept in its own file so the
 * launch screen can import the param list without importing the navigator that
 * renders it.
 */

/**
 * Toast handed back to the launch screen when a report is submitted.
 *
 * Unlike the other modules' toasts this carries no `routeId` and its consumer
 * renders no View action — there is nowhere in the app to view a submitted
 * visit. That is the point of the module, not an omission.
 */
export interface OffHoursVisitToast {
  title: string;
  message: string;
  variant?: 'success' | 'danger';
}

export type OffHoursVisitStackParamList = {
  OffHoursVisitList: {toast?: OffHoursVisitToast} | undefined;
  /**
   * `origin` is the tab the create was asked for from, so closing it unsaved
   * can go back there — the trip into this module never really happened.
   */
  OffHoursVisitCreate: {origin?: string} | undefined;
};

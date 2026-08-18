/**
 * Toast handed back to the list when a create, update or delete finishes.
 *
 * Create hands one back on submit, and View on delete.
 */
export interface ObservationReportsToast {
  title: string;
  message: string;
  /** Record id used by the toast's View action. Empty when there is nowhere to go. */
  routeId: string;
  variant?: 'success' | 'danger';
}

export type ObservationReportsStackParamList = {
  ObservationReportsList: {toast?: ObservationReportsToast} | undefined;
  ObservationReportsView: {id: string};
  /**
   * `origin` is the tab the create was asked for from, so closing it unsaved
   * can go back there — the trip into this module never really happened.
   */
  ObservationReportsCreate: {origin?: string} | undefined;
};

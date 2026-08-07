/**
 * Route table for the Work tab's stack. Kept in its own file so the list
 * screen can import the param list without importing the navigator that
 * renders it.
 */

/** Toast handed back to the list when a create or delete finishes. */
export interface WorkToast {
  title: string;
  message: string;
  variant?: 'success' | 'danger';
}

export type WorkStackParamList = {
  /**
   * `refresh` asks the list to refetch on arrival. Deleting from a detail
   * route changes the list underneath it, and unlike the other modules this
   * list mixes several sources, so it can't rely on a single refetchQueries.
   */
  WorkList: {toast?: WorkToast; refresh?: boolean} | undefined;
  /**
   * `origin` is the tab the create was asked for from, so closing it unsaved
   * can go back there — the trip into this module never really happened.
   */
  WorkLogCreate: {origin?: string} | undefined;
  WorkLogView: {id: string};
  /**
   * Work lists other modules' records too, so it opens their detail screens
   * in its own stack rather than sending the user to another tab.
   */
  WorkMaintenanceView: {id: string};
  WorkFixtureView: {id: string};
};

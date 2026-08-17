/**
 * Route table for the Shift Notes tab's stack. Kept in its own file so the
 * launch screen can import the param list without importing the navigator that
 * renders it.
 */

/**
 * Toast handed back to the launch screen when a note is sent.
 *
 * Like `OffHoursVisitToast` this carries no `routeId` and its consumer renders
 * no View action — there is nowhere in the app to read a shared note back.
 * That is the point of the module, not an omission.
 */
export interface ShiftNoteToast {
  title: string;
  message: string;
  variant?: 'success' | 'danger';
}

export type ShiftNotesStackParamList = {
  ShiftNotesList: {toast?: ShiftNoteToast} | undefined;
  /**
   * `origin` is the tab the create was asked for from, so closing it unsaved
   * can go back there — the trip into this module never really happened.
   */
  ShiftNotesCreate: {origin?: string} | undefined;
};

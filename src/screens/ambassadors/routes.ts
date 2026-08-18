/**
 * Route table for the Ambassadors tab's stack. Kept in its own file so the
 * list screen can import the param list without importing the navigator that
 * renders it.
 *
 * Read-only, end to end — no create/edit/delete route exists here, so unlike
 * every other module's routes.ts there is no toast param to carry back.
 */
export type AmbassadorsStackParamList = {
  AmbassadorsList: undefined;
  AmbassadorsProfile: {id: string};
  AmbassadorsWorkList: {ambassadorId: string; ambassadorName: string};
  AmbassadorsWorkView: {id: string};
  AmbassadorsReportsList: {ambassadorId: string; ambassadorName: string};
  AmbassadorsReportView: {id: string};
};

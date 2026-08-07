/**
 * Route table for the POI tab's stack. Kept in its own file so the list and
 * detail screens can import the param list without importing the navigator
 * that renders them.
 */

/** Toast handed back to the list when a create or delete finishes. */
export interface PoiToast {
  title: string;
  message: string;
  /** Record id used by the toast's View action. Empty when there is nowhere to go. */
  routeId: string;
  variant?: 'success' | 'danger';
}

/**
 * `origin` is the tab the create was asked for from, so closing it unsaved can
 * go back there. `personId`/`personName` are set when the sub-record was
 * started from a specific person, which locks the form's person field.
 */
export interface PoiSubRecordParams {
  origin?: string;
  personId?: string;
  personName?: string;
}

export type PoiStackParamList = {
  PoiList: {toast?: PoiToast} | undefined;
  PoiCreatePerson: {origin?: string} | undefined;
  PoiCreateInteraction: PoiSubRecordParams | undefined;
  PoiCreateUpdate: PoiSubRecordParams | undefined;
  PoiView: {id: string};
};

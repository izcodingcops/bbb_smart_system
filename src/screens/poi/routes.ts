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
 * `personId`/`personName` are set when the sub-record was started from a
 * specific person, which locks the form's person field.
 *
 * There is no `origin` here, unlike `PoiCreatePerson`: Interaction and Update
 * are only reachable from a card or the person detail screen, both already on
 * this tab, so closing unsaved has nowhere else to bounce back to.
 */
export interface PoiSubRecordParams {
  personId?: string;
  personName?: string;
}

export type PoiStackParamList = {
  PoiList: {toast?: PoiToast} | undefined;
  /**
   * `origin` is the tab the create was asked for from, so closing it unsaved
   * can return there — same convention as Fixture/Maintenance/Incident. Set
   * when the Add Requests POI tile is tapped from a different tab.
   */
  PoiCreatePerson: {origin?: string} | undefined;
  PoiCreateInteraction: PoiSubRecordParams | undefined;
  PoiCreateUpdate: PoiSubRecordParams | undefined;
  PoiView: {id: string};
};

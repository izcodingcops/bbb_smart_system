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
 * There is no `origin` here, unlike the other modules' create routes: every
 * way into POI's creates goes through the chooser on the POI list, so the user
 * is already visibly on this tab and closing unsaved returns them to it.
 */
export interface PoiSubRecordParams {
  personId?: string;
  personName?: string;
}

export type PoiStackParamList = {
  /**
   * `openChooser` is how the Add Requests POI tile arrives: POI has three
   * record types, so the tile lands here and the three-way chooser opens over
   * the list rather than guessing a create screen.
   *
   * There is no `origin` counterpart. Unlike the other modules' tiles, this one
   * puts the user visibly on the POI tab rather than covering the switch with a
   * form — so dismissing the chooser, or closing a create it led to, leaves
   * them here rather than bouncing back to a tab they can see they left.
   */
  PoiList: {toast?: PoiToast; openChooser?: boolean} | undefined;
  PoiCreatePerson: undefined;
  PoiCreateInteraction: PoiSubRecordParams | undefined;
  PoiCreateUpdate: PoiSubRecordParams | undefined;
  PoiView: {id: string};
};

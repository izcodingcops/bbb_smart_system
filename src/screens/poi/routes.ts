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
  /**
   * `openChooser` is how the Add Requests POI tile arrives: POI has three
   * record types, so the tile lands here and the three-way chooser opens over
   * the list rather than guessing a create screen. `origin` rides along so
   * backing out — whether by dismissing the chooser or closing the create it
   * leads to — returns to the tab the tile was tapped on.
   */
  PoiList: {toast?: PoiToast; openChooser?: boolean; origin?: string} | undefined;
  PoiCreatePerson: {origin?: string} | undefined;
  PoiCreateInteraction: PoiSubRecordParams | undefined;
  PoiCreateUpdate: PoiSubRecordParams | undefined;
  PoiView: {id: string};
};

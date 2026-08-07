import {MapCoordinate} from '../../types/maps';

/**
 * Route table for the Maps tab's stack. Kept in its own file so the list
 * screen can import the param list without importing the navigator that
 * renders it.
 */
export type MapsStackParamList = {
  /** Name of the map just saved, so the list can toast on arrival. */
  MapsList: {savedName?: string} | undefined;
  /**
   * The list resolves the device's current fix for its location card; the
   * save flow starts from that same coordinate rather than resolving again.
   */
  MapsDownload: {initialCoordinate?: MapCoordinate | null} | undefined;
};

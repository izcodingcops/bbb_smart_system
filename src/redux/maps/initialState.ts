import {MapsState} from '../../types/maps';
import {MOCK_DOWNLOADED_MAPS} from '../../mocks/maps';

/**
 * The shipped app's cap, carried over verbatim. It was chosen when a
 * "download" genuinely fetched Mapbox offline packs; it is conservative now
 * that a record is a coordinate, but changing it is a product decision.
 */
export const MAX_DOWNLOADED_MAPS = 5;

/** Copied, not referenced — the reducer must not mutate the mock array. */
export const initialMapsState: MapsState = {
  items: [...MOCK_DOWNLOADED_MAPS],
};

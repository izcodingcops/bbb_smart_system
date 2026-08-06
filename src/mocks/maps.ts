import {DownloadedMap, MapCoordinate, MapSuggestion, PickedLocation} from '../types/maps';

/**
 * A suggestion that already knows where it is. Only the keyless fallback in
 * `src/services/maps.ts` reads `coordinate` — a live Places Details call
 * supplies it instead — so it stays out of the shared MapSuggestion type.
 */
export interface MockMapPlace extends MapSuggestion {
  coordinate: MapCoordinate;
}

/**
 * Captured once at module load. Every seeded date is expressed relative to it
 * — the technique src/mocks/dispatch.ts and src/mocks/incident.ts use — so the
 * seed cannot go stale the way three mock files in this app already have.
 */
const SEED_NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;

/** Preserves the mockup's Jul 12 / 10 / 8 / 5 / 1 spacing against today. */
function seedDaysAgo(days: number): string {
  return new Date(SEED_NOW - days * DAY).toISOString();
}

/** Downtown Denver — where every mockup record sits. */
export const DENVER_DEFAULT_COORDINATE: MapCoordinate = {
  latitude: 39.7481,
  longitude: -104.9997,
};

/**
 * What `reverseGeocode` answers with when no API key is configured, so the
 * module stays exercisable — and the visual pass possible — before one exists.
 */
export const MOCK_CURRENT_LOCATION: PickedLocation = {
  name: 'Downtown Denver BID',
  address: '1445 Larimer St, Denver, CO 80202',
  coordinate: DENVER_DEFAULT_COORDINATE,
};

/**
 * The mockup's five records, names and addresses verbatim. Ids are opaque
 * rather than the mockup's dl1…dl5: an accidental id/name swap then shows up
 * on screen instead of compiling silently.
 */
export const MOCK_DOWNLOADED_MAPS: DownloadedMap[] = [
  {
    id: 'map_9f31c07a',
    name: 'Union Station',
    address: '1701 Wynkoop St, Denver, CO 80202',
    downloadedAt: seedDaysAgo(1),
    coordinate: {latitude: 39.7526, longitude: -105.0002},
  },
  {
    id: 'map_4b8ea215',
    name: '16th Street Mall',
    address: '900 16th St, Denver, CO 80202',
    downloadedAt: seedDaysAgo(3),
    coordinate: {latitude: 39.7472, longitude: -104.9938},
  },
  {
    id: 'map_2c6d5093',
    name: 'Civic Center Park',
    address: '101 W 14th Ave Pkwy, Denver, CO 80204',
    downloadedAt: seedDaysAgo(5),
    coordinate: {latitude: 39.7375, longitude: -104.9895},
  },
  {
    id: 'map_7ad0e4f6',
    name: 'Larimer Square',
    address: '1430 Larimer St, Denver, CO 80202',
    downloadedAt: seedDaysAgo(8),
    coordinate: {latitude: 39.7476, longitude: -104.9994},
  },
  {
    id: 'map_e51b8c34',
    name: 'LoDo District',
    address: '1601 Wewatta St, Denver, CO 80202',
    downloadedAt: seedDaysAgo(12),
    coordinate: {latitude: 39.7515, longitude: -105.0026},
  },
];

/** The export's four suggestions, serving the keyless autocomplete fallback. */
export const MOCK_MAP_SUGGESTIONS: MockMapPlace[] = [
  {
    placeId: 'mock_ball_arena',
    name: 'Ball Arena',
    address: '1000 Chopper Cir, Denver, CO 80204',
    coordinate: {latitude: 39.7487, longitude: -105.0077},
  },
  {
    placeId: 'mock_coors_field',
    name: 'Coors Field',
    address: '2001 Blake St, Denver, CO 80205',
    coordinate: {latitude: 39.7559, longitude: -104.9942},
  },
  {
    placeId: 'mock_denver_art_museum',
    name: 'Denver Art Museum',
    address: '100 W 14th Ave Pkwy, Denver, CO 80204',
    coordinate: {latitude: 39.7372, longitude: -104.9893},
  },
  {
    placeId: 'mock_botanic_gardens',
    name: 'Denver Botanic Gardens',
    address: '1007 York St, Denver, CO 80206',
    coordinate: {latitude: 39.7323, longitude: -104.9609},
  },
];

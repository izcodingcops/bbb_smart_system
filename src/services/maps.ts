import {GOOGLE_MAPS_API_KEY} from '@env';
import {MapCoordinate, MapSuggestion, PickedLocation} from '../types/maps';
import {MOCK_CURRENT_LOCATION, MOCK_MAP_SUGGESTIONS} from '../mocks/maps';
import {locationTracker} from '../utils/locationTracker';

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

/**
 * The three caches below are not a rendering optimisation. Google bills per
 * request and the free tiers are per-SKU with no pooling — the shared $200
 * credit was withdrawn on 1 March 2025 — so every suppressed call is money.
 */

/** ≈30 m. Wide enough to absorb GPS jitter, tight enough to change on a real move. */
const GEOCODE_GRID = 0.00027;
const REVERSE_GEOCODE_TTL_MS = 3 * 60 * 60 * 1000;
const PLACE_DETAILS_TTL_MS = 24 * 60 * 60 * 1000;
const AUTOCOMPLETE_CACHE_LIMIT = 100;

interface CacheEntry<T> {
  value: T;
  at: number;
}

const reverseCache = new Map<string, CacheEntry<PickedLocation>>();
const detailsCache = new Map<string, CacheEntry<PickedLocation>>();
const autocompleteCache = new Map<string, MapSuggestion[]>();

export function hasMapsApiKey(): boolean {
  return (
    typeof GOOGLE_MAPS_API_KEY === 'string' && GOOGLE_MAPS_API_KEY.length > 0
  );
}

/**
 * One token per search session. Without it Google bills Autocomplete per
 * keystroke; with it the whole session plus its closing Details call is billed
 * once. The save screen mints one on focus and retires it after a pick.
 */
export function newSessionToken(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The naming rule, in one place. Google returns a single formatted address;
 * the list row needs a short name above it, so the first comma-segment becomes
 * the name and the whole string stays as the address. The shipped app stored
 * only the formatted string and had no name field.
 */
export function splitFormattedAddress(formatted: string): {
  name: string;
  address: string;
} {
  const trimmed = formatted.trim();
  const head = trimmed.split(',')[0]?.trim() ?? '';
  return {name: head || trimmed, address: trimmed};
}

/**
 * Reads the one-shot fix from the app's existing native location stack rather
 * than standing up a second CLLocationManager — the same single-source rule
 * `src/graphql/offlineQueue/connectivity.ts` documents for connectivity.
 *
 * Resolves null when the permission is refused or there is no fix yet.
 * Callers degrade in place; the shipped app's goToHomeScreen() bailout is
 * deliberately not carried over.
 */
export async function getCurrentPosition(): Promise<MapCoordinate | null> {
  try {
    const status = await locationTracker.getPermissionStatus();
    if (status !== 'ok') {
      const granted = await locationTracker.requestStage('fine');
      if (!granted) {
        return null;
      }
    }
    const fix = await locationTracker.getCurrentLocation();
    return {latitude: fix.latitude, longitude: fix.longitude};
  } catch {
    return null;
  }
}

/** Snaps a coordinate to the cache grid so nearby reads share one entry. */
function gridKey(coordinate: MapCoordinate): string {
  const lat = Math.round(coordinate.latitude / GEOCODE_GRID);
  const lng = Math.round(coordinate.longitude / GEOCODE_GRID);
  return `${lat}:${lng}`;
}

export async function reverseGeocode(
  coordinate: MapCoordinate,
): Promise<PickedLocation | null> {
  const key = gridKey(coordinate);
  const hit = reverseCache.get(key);
  if (hit && Date.now() - hit.at < REVERSE_GEOCODE_TTL_MS) {
    return hit.value;
  }

  if (!hasMapsApiKey()) {
    // Keyless build: everything but live tiles still works, so the module
    // stays exercisable before a key exists.
    return {...MOCK_CURRENT_LOCATION, coordinate};
  }

  try {
    const url =
      `${GEOCODE_URL}?latlng=${coordinate.latitude},${coordinate.longitude}` +
      `&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const body = await response.json();
    if (body?.status !== 'OK') {
      return null;
    }
    const formatted: string | undefined = body.results?.[0]?.formatted_address;
    if (!formatted) {
      return null;
    }
    const {name, address} = splitFormattedAddress(formatted);
    const value: PickedLocation = {name, address, coordinate};
    reverseCache.set(key, {value, at: Date.now()});
    return value;
  } catch {
    return null;
  }
}

/** FIFO: a Map preserves insertion order, so the first key is the oldest. */
function rememberSuggestions(key: string, value: MapSuggestion[]): void {
  autocompleteCache.set(key, value);
  while (autocompleteCache.size > AUTOCOMPLETE_CACHE_LIMIT) {
    const oldest = autocompleteCache.keys().next().value;
    if (oldest === undefined) {
      break;
    }
    autocompleteCache.delete(oldest);
  }
}

/** `[]` means no matches; `null` means the call failed. */
export async function autocomplete(
  query: string,
  sessionToken: string,
): Promise<MapSuggestion[] | null> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const cached = autocompleteCache.get(trimmed);
  if (cached) {
    return cached;
  }

  if (!hasMapsApiKey()) {
    const needle = trimmed.toLowerCase();
    return MOCK_MAP_SUGGESTIONS.filter(place =>
      `${place.name} ${place.address}`.toLowerCase().includes(needle),
    ).map(({placeId, name, address}) => ({placeId, name, address}));
  }

  try {
    const url =
      `${PLACES_BASE}/autocomplete/json?input=${encodeURIComponent(trimmed)}` +
      `&sessiontoken=${encodeURIComponent(sessionToken)}` +
      `&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const body = await response.json();
    if (body?.status !== 'OK' && body?.status !== 'ZERO_RESULTS') {
      return null;
    }
    const suggestions: MapSuggestion[] = (body.predictions ?? []).map(
      (prediction: any) => ({
        placeId: prediction.place_id,
        name:
          prediction.structured_formatting?.main_text ??
          prediction.description ??
          '',
        address: prediction.structured_formatting?.secondary_text ?? '',
      }),
    );
    rememberSuggestions(trimmed, suggestions);
    return suggestions;
  } catch {
    return null;
  }
}

/**
 * Closes the autocomplete session. `name` rides along with geometry and
 * formatted_address in Place Details' Basic Data field group, so asking for it
 * costs nothing beyond the call already being made.
 */
export async function placeDetails(
  placeId: string,
  sessionToken: string,
): Promise<PickedLocation | null> {
  const hit = detailsCache.get(placeId);
  if (hit && Date.now() - hit.at < PLACE_DETAILS_TTL_MS) {
    return hit.value;
  }

  if (!hasMapsApiKey()) {
    const place = MOCK_MAP_SUGGESTIONS.find(item => item.placeId === placeId);
    return place
      ? {name: place.name, address: place.address, coordinate: place.coordinate}
      : null;
  }

  try {
    const url =
      `${PLACES_BASE}/details/json?place_id=${encodeURIComponent(placeId)}` +
      '&fields=geometry,formatted_address,name' +
      `&sessiontoken=${encodeURIComponent(sessionToken)}` +
      `&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const body = await response.json();
    const location = body?.result?.geometry?.location;
    if (body?.status !== 'OK' || !location) {
      return null;
    }
    const formatted: string = body.result.formatted_address ?? '';
    const split = splitFormattedAddress(formatted);
    const value: PickedLocation = {
      name: body.result.name || split.name,
      address: formatted || split.address,
      coordinate: {latitude: location.lat, longitude: location.lng},
    };
    detailsCache.set(placeId, {value, at: Date.now()});
    return value;
  } catch {
    return null;
  }
}

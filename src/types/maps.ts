export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

/** What MapView's `region` prop wants. */
export interface MapRegion extends MapCoordinate {
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * A saved location. Despite the module's name nothing downloads map tiles —
 * this is a named coordinate, exactly as the shipped app stores it. Neither
 * react-native-maps nor Google's SDK can cache tiles for third-party apps;
 * real offline maps would be a Mapbox/MapLibre project.
 */
export interface DownloadedMap {
  /** Opaque local identifier. Never displayed — the UI shows `name`. */
  id: string;
  /** Resolved place name, e.g. 'Union Station'. */
  name: string;
  /** Formatted address at the pin. */
  address: string;
  /** ISO-8601 — when it was saved. */
  downloadedAt: string;
  coordinate: MapCoordinate;
}

/** A Places Autocomplete result, before its coordinate is resolved. */
export interface MapSuggestion {
  /** Google `place_id`. The keyless fallback synthesises a stable one. */
  placeId: string;
  /** `structured_formatting.main_text`. */
  name: string;
  /** `structured_formatting.secondary_text`. */
  address: string;
}

/** A resolved location the save flow is pinned at. */
export interface PickedLocation {
  name: string;
  address: string;
  coordinate: MapCoordinate;
}

/** The persisted slice. Joins auth/shift/outbox in the persisted root. */
export interface MapsState {
  items: DownloadedMap[];
}

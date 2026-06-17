export const UPDATE_LOCATION = 'location/UPDATE_LOCATION';

export interface UserLocation {
  latitude: number;
  longitude: number;
  altitude: number | null;
  horizontalAccuracy: number;
  verticalAccuracy: number | null;
  heading: number | null;
  timestamp: number;
}

export interface LocationState {
  currentLocation: UserLocation | null;
}

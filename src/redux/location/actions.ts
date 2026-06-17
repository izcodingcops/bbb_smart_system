import {UPDATE_LOCATION, UserLocation} from './types';

export const updateLocation = (location: UserLocation) => ({
  type: UPDATE_LOCATION as typeof UPDATE_LOCATION,
  payload: location,
});

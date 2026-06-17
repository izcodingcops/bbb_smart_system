import {useAppSelector} from '../store';

export const GetCurrentLocation = () =>
  useAppSelector(state => (state as any).location?.currentLocation ?? null);

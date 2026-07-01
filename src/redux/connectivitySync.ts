import {locationTracker} from '../utils/locationTracker';
import {syncOfflineQueue} from './offlineQueue/slice';
import type {AppDispatch} from './store';

/**
 * Bridges the native connectivity-change event into a redux dispatch.
 * Replaces the old rootSaga eventChannel watcher — there's no saga runtime
 * left to translate the NativeEventEmitter subscription into `take`s, so
 * this just dispatches directly whenever the device comes back online.
 */
export function startConnectivitySync(dispatch: AppDispatch): () => void {
  return locationTracker.onConnectivityChange(online => {
    if (online) {
      dispatch(syncOfflineQueue());
    }
  });
}

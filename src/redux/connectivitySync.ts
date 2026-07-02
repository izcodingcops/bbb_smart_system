import {createAction, createListenerMiddleware} from '@reduxjs/toolkit';
import {locationTracker} from '../utils/locationTracker';
import {syncOfflineQueue} from './offlineQueue/slice';

/**
 * Dispatched once at store startup to kick off the connectivity listener
 * below — `createListenerMiddleware` reacts to dispatched actions, so
 * bridging a native NativeEventEmitter subscription into it needs a single
 * boot action to attach to rather than a raw predicate.
 */
export const appStarted = createAction('app/started');

/**
 * Bridges the native connectivity-change event into a redux dispatch via
 * RTK's own listener-middleware primitive, replacing the old rootSaga
 * eventChannel watcher. The subscription is meant to live for the app's
 * entire process lifetime (there's exactly one store, never torn down
 * mid-session) — `listenerApi.signal` still wires up `unsubscribe` for the
 * rare case the listener itself is ever cancelled.
 */
export const connectivityListenerMiddleware = createListenerMiddleware();

connectivityListenerMiddleware.startListening({
  actionCreator: appStarted,
  effect: (_action, listenerApi) => {
    const unsubscribe = locationTracker.onConnectivityChange(online => {
      if (online) {
        listenerApi.dispatch(syncOfflineQueue());
      }
    });
    listenerApi.signal.addEventListener('abort', unsubscribe);
  },
});

import {OfflineError} from '../api/offlineError';

/**
 * Dev-only switch for manually testing the offline read-cache and
 * write-queue paths in the simulator without needing a live backend or
 * real connectivity loss. Flip to `true`, reload, test, then flip back.
 * Guarded by `__DEV__` so it can never affect a release build regardless
 * of this value.
 */
export const DEV_FLAGS = {
  simulateOffline: false,
};

export function throwIfSimulatingOffline(): void {
  if (__DEV__ && DEV_FLAGS.simulateOffline) {
    throw new OfflineError('Simulated offline (DEV_FLAGS.simulateOffline)');
  }
}

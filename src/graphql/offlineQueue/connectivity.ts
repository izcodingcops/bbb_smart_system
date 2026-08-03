import NetInfo, {NetInfoState} from '@react-native-community/netinfo';

type Listener = (online: boolean) => void;

/**
 * Holds connectivity state outside redux, same reasoning as
 * `graphql/authToken.ts`: `link.ts` needs to read it synchronously on every
 * mutation without importing the store into a module the store itself
 * doesn't depend on.
 */
let online = true;
let initialized = false;
const listeners = new Set<Listener>();

function deriveOnline(state: NetInfoState): boolean {
  // `isInternetReachable` is frequently `null` right after launch even when
  // there is a connection — only treat it as offline when NetInfo is sure.
  return Boolean(state.isConnected) && state.isInternetReachable !== false;
}

export const connectivity = {
  isOnline: (): boolean => online,

  /** Fires on every online <-> offline transition, not on every NetInfo event. */
  onChange: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  init: (): Promise<void> => {
    if (initialized) {
      return Promise.resolve();
    }
    initialized = true;
    const fetchPromise = NetInfo.fetch()
      .then(state => {
        online = deriveOnline(state);
      })
      .catch(() => {
        // Keep the module-level default and let the event listener below
        // correct it once NetInfo is able to report state.
      });
    NetInfo.addEventListener(state => {
      const next = deriveOnline(state);
      if (next !== online) {
        online = next;
        listeners.forEach(listener => listener(online));
      }
    });
    return fetchPromise;
  },
};

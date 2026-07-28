import {MigrationManifest, PersistedState} from 'redux-persist';
import {initialAuthState} from './auth/initialState';
import {initialShiftState} from './shift/initialState';

/**
 * Bump PERSIST_VERSION and add a migration whenever a persisted slice gains or
 * changes a field. Without this, state saved by an older build rehydrates
 * missing the new keys and selectors read `undefined`.
 */
export const PERSIST_VERSION = 2;

export const migrations: MigrationManifest = {
  // v1: auth gained programs/activeProgramId/shiftTypes; the shift slice was
  // introduced. Backfill both from their initial state.
  1: (state): PersistedState => {
    const previous = state as Record<string, any> | undefined;
    if (!previous) {
      return state;
    }
    return {
      ...previous,
      auth: {...initialAuthState, ...(previous.auth ?? {})},
      shift: {...initialShiftState, ...(previous.shift ?? {})},
    } as unknown as PersistedState;
  },

  // v2: RTK Query removed (drop the orphaned `api` key) and
  // User.enable_shift_entry renamed to enableShiftEntry.
  2: (state): PersistedState => {
    const previous = state as Record<string, any> | undefined;
    if (!previous) {
      return state;
    }
    const rest = {...previous};
    delete rest.api;

    const user = rest.auth?.user;
    if (user) {
      const nextUser = {...user};
      nextUser.enableShiftEntry =
        user.enableShiftEntry ?? user.enable_shift_entry;
      delete nextUser.enable_shift_entry;
      rest.auth = {...rest.auth, user: nextUser};
    }

    return rest as unknown as PersistedState;
  },
};

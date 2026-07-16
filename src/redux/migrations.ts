import {MigrationManifest, PersistedState} from 'redux-persist';
import {initialAuthState} from './auth/slice';
import {initialShiftState} from './shift/slice';

/**
 * Bump PERSIST_VERSION and add a migration whenever a persisted slice gains or
 * changes a field. Without this, state saved by an older build rehydrates
 * missing the new keys and selectors read `undefined`.
 */
export const PERSIST_VERSION = 1;

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
};

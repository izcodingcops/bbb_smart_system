import {MigrationManifest, PersistedState} from 'redux-persist';
import {initialAuthState} from './auth/initialState';
import {initialShiftState} from './shift/initialState';
import {initialMapsState} from './maps/initialState';
import {initialOutboxState} from './outbox/initialState';

/**
 * Bump PERSIST_VERSION and add a migration whenever a persisted slice gains or
 * changes a field. Without this, state saved by an older build rehydrates
 * missing the new keys and selectors read `undefined`.
 */
export const PERSIST_VERSION = 5;

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

  // v3: the Maps module added a persisted `maps` slice. State saved by an
  // older build has no such key, and GetDownloadedMaps() would read
  // `undefined` after upgrade. Spread initial state first so an install that
  // already has items keeps them rather than being reseeded.
  3: (state): PersistedState => {
    const previous = state as Record<string, any> | undefined;
    if (!previous) {
      return state;
    }
    return {
      ...previous,
      maps: {...initialMapsState, ...(previous.maps ?? {})},
    } as unknown as PersistedState;
  },

  // v4: outbox items gained `attempts`/`lastError` and the slice gained a
  // `failed` list. State saved by an older build has neither, so flushOutbox
  // would increment `undefined` and never dead-letter. Spread the item last so
  // an install that somehow already has the fields keeps its counts.
  4: (state): PersistedState => {
    const previous = state as Record<string, any> | undefined;
    if (!previous) {
      return state;
    }
    const outbox = previous.outbox ?? initialOutboxState;
    return {
      ...previous,
      outbox: {
        ...initialOutboxState,
        ...outbox,
        items: (outbox.items ?? []).map((item: any) => ({
          attempts: 0,
          lastError: null,
          ...item,
        })),
        failed: outbox.failed ?? [],
      },
    } as unknown as PersistedState;
  },

  // v5: User gained `role`. State saved by an older build has no such field,
  // so role-gated reads would see `undefined` instead of a valid UserRole.
  // Default to 'ambassador' — the role every persisted session predates.
  5: (state): PersistedState => {
    const previous = state as Record<string, any> | undefined;
    if (!previous) {
      return state;
    }
    const user = previous.auth?.user;
    if (!user) {
      return previous as unknown as PersistedState;
    }
    return {
      ...previous,
      auth: {...previous.auth, user: {role: 'ambassador', ...user}},
    } as unknown as PersistedState;
  },
};

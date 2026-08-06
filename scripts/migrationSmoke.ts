import assert from 'node:assert/strict';
import {migrations, PERSIST_VERSION} from '../src/redux/migrations';

type Check = [name: string, run: () => void];

const checks: Check[] = [
  ['PERSIST_VERSION is 3', () => {
    assert.equal(PERSIST_VERSION, 3);
  }],

  ['migration 2 drops the api key entirely', () => {
    const input = {api: {queries: {}}, auth: {}, shift: {}, ui: {}};
    const result: any = migrations[2]!(input as any);
    assert.equal('api' in result, false);
  }],

  ['migration 2 renames enable_shift_entry to enableShiftEntry', () => {
    const input = {
      api: {},
      auth: {user: {id: 'u1', enable_shift_entry: true}},
    };
    const result: any = migrations[2]!(input as any);
    assert.equal(result.auth.user.enableShiftEntry, true);
    assert.equal('enable_shift_entry' in result.auth.user, false);
  }],

  ['migration 2 leaves auth.session and shift untouched', () => {
    const input = {
      api: {},
      auth: {
        session: {token: 'abc123', refreshToken: 'refresh456'},
        user: {id: 'u1', enable_shift_entry: false},
      },
      shift: {activeShift: null, clockedIn: false},
    };
    const result: any = migrations[2]!(input as any);
    assert.deepEqual(result.auth.session, input.auth.session);
    assert.deepEqual(result.shift, input.shift);
  }],

  ['migration 2 handles undefined state without throwing', () => {
    const result = migrations[2]!(undefined as any);
    assert.equal(result, undefined);
  }],

  ['migration 2 handles a missing auth key without throwing', () => {
    const input = {api: {}, shift: {}};
    const result: any = migrations[2]!(input as any);
    assert.equal('api' in result, false);
    assert.equal(result.auth, undefined);
  }],

  ['migration 2 handles a missing auth.user without throwing', () => {
    const input = {api: {}, auth: {session: {token: 'abc123'}}};
    const result: any = migrations[2]!(input as any);
    assert.equal('api' in result, false);
    assert.deepEqual(result.auth.session, {token: 'abc123'});
    assert.equal(result.auth.user, undefined);
  }],

  ['migration 1 backfills auth and shift from initial state', () => {
    const input = {auth: {activeProgramId: 'p1'}, shift: {isActive: true}};
    const result: any = migrations[1]!(input as any);
    assert.equal(result.auth.activeProgramId, 'p1');
    // Backfilled field from initialAuthState, not present in the input.
    assert.equal(result.auth.isAuthenticated, false);
    assert.equal(result.shift.isActive, true);
    // Backfilled field from initialShiftState, not present in the input.
    assert.equal(result.shift.autoEnd, true);
  }],

  ['migration 3 backfills maps for state saved before the slice existed', () => {
    const input = {auth: {}, shift: {}, outbox: {items: []}};
    const result: any = migrations[3]!(input as any);
    assert.equal(Array.isArray(result.maps.items), true);
    // Seeded from src/mocks/maps.ts, so an upgraded install isn't empty.
    assert.equal(result.maps.items.length > 0, true);
  }],

  ['migration 3 preserves existing maps.items rather than reseeding', () => {
    const saved = [
      {
        id: 'map_saved',
        name: 'Saved',
        address: 'Somewhere',
        downloadedAt: '2026-01-01T00:00:00.000Z',
        coordinate: {latitude: 1, longitude: 2},
      },
    ];
    const input = {auth: {}, maps: {items: saved}};
    const result: any = migrations[3]!(input as any);
    assert.deepEqual(result.maps.items, saved);
  }],

  ['migration 3 leaves the other slices untouched', () => {
    const input = {
      auth: {session: {token: 'abc123'}},
      shift: {isActive: true},
      outbox: {items: [{id: 'outbox_1'}]},
    };
    const result: any = migrations[3]!(input as any);
    assert.deepEqual(result.auth, input.auth);
    assert.deepEqual(result.shift, input.shift);
    assert.deepEqual(result.outbox, input.outbox);
  }],

  ['migration 3 handles undefined state without throwing', () => {
    const result = migrations[3]!(undefined as any);
    assert.equal(result, undefined);
  }],
];

function main() {
  let failed = 0;
  for (const [name, fn] of checks) {
    try {
      fn();
      console.log(`  ok   ${name}`);
    } catch (error: any) {
      failed++;
      console.log(`  FAIL ${name}\n       ${error.message}`);
    }
  }
  console.log(`\n${checks.length - failed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main();

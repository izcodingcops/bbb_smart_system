import assert from 'node:assert/strict';
import outboxReducer, {enqueued, synced} from '../src/redux/outbox/slice';
import {OutboxItem} from '../src/types/offlineQueue';

type Check = [name: string, run: () => void];

const item: OutboxItem = {
  id: 'outbox_1',
  mutationKey: 'CREATE_WORK_LOG_ENTRY',
  variables: {programId: 'p1', input: {entryType: 'Litter Pickup'}},
  createdAt: '2026-08-03T09:00:00.000Z',
};

const checks: Check[] = [
  ['starts empty', () => {
    const state = outboxReducer(undefined, {type: '@@INIT'});
    assert.deepEqual(state.items, []);
  }],

  ['enqueued appends the item unchanged', () => {
    const state = outboxReducer(undefined, enqueued(item));
    assert.equal(state.items.length, 1);
    assert.deepEqual(state.items[0], item);
  }],

  ['enqueued keeps prior items and appends in order', () => {
    let state = outboxReducer(undefined, enqueued(item));
    const second: OutboxItem = {...item, id: 'outbox_2'};
    state = outboxReducer(state, enqueued(second));
    assert.deepEqual(state.items.map(i => i.id), ['outbox_1', 'outbox_2']);
  }],

  ['synced removes only the matching item', () => {
    let state = outboxReducer(undefined, enqueued(item));
    const second: OutboxItem = {...item, id: 'outbox_2'};
    state = outboxReducer(state, enqueued(second));
    state = outboxReducer(state, synced({id: 'outbox_1'}));
    assert.deepEqual(state.items.map(i => i.id), ['outbox_2']);
  }],

  ['synced on an unknown id is a no-op', () => {
    const state = outboxReducer(outboxReducer(undefined, enqueued(item)), synced({id: 'nope'}));
    assert.equal(state.items.length, 1);
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

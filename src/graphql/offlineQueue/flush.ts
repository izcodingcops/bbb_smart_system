import {apolloClient} from '../client';
import {store} from '../../redux/store';
import {synced} from '../../redux/outbox/slice';
import {OfflineMutationKey} from '../../types/offlineQueue';
import {logger} from '../../utils/logger';
import {OFFLINE_MUTATIONS} from './registry';

let flushing = false;

/**
 * Replays queued mutations one at a time, in the order they were queued, so
 * a mock resolver whose `nextReference()` depends on prior records (Work
 * Log's does) computes correct, unique references across a whole batch.
 * Stops at the first failure rather than skipping past it — the failed
 * item stays queued and the next reconnect (or app boot) retries the whole
 * remaining queue from the front.
 */
export async function flushOutbox(): Promise<void> {
  if (flushing) {
    return;
  }
  flushing = true;
  try {
    const items = store.getState().outbox.items;
    for (const item of items) {
      const entry = OFFLINE_MUTATIONS[item.mutationKey as OfflineMutationKey];
      try {
        await apolloClient.mutate({
          mutation: entry.document,
          variables: item.variables,
          context: {feature: entry.feature},
          refetchQueries: entry.refetchQueries,
          awaitRefetchQueries: true,
        });
        store.dispatch(synced({id: item.id}));
      } catch (error) {
        logger.warn('OfflineQueue', `Failed to sync queued ${item.mutationKey}`, error);
        break;
      }
    }
  } finally {
    flushing = false;
  }
}

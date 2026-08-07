import {apolloClient} from '../client';
import {store} from '../../redux/store';
import {MAX_SYNC_ATTEMPTS, syncFailed, synced} from '../../redux/outbox/slice';
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
 * remaining queue from the front. The one exception is an item that has
 * exhausted MAX_SYNC_ATTEMPTS: the reducer dead-letters it into
 * `outbox.failed`, and the flush continues with the rest of the queue, whose
 * relative order is unchanged.
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
      if (!entry) {
        logger.warn('OfflineQueue', `Dropping queued item with unrecognized mutationKey ${item.mutationKey}`);
        store.dispatch(synced({id: item.id}));
        continue;
      }
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
        const message = error instanceof Error ? error.message : String(error);
        store.dispatch(syncFailed({id: item.id, error: message}));

        // The reducer moves an item out of `items` once it reaches
        // MAX_SYNC_ATTEMPTS. If it is gone, the blockage went with it and the
        // rest of the queue — still in its original order — can proceed. If it
        // is still queued, stop here: items behind it may depend on it
        // (ADD_POI_INTERACTION needs its CREATE_POI to have landed).
        const stillQueued = store
          .getState()
          .outbox.items.some(queued => queued.id === item.id);

        if (stillQueued) {
          logger.warn(
            'OfflineQueue',
            `Failed to sync queued ${item.mutationKey}; will retry`,
            error,
          );
          break;
        }

        logger.warn(
          'OfflineQueue',
          `Dead-lettered ${item.mutationKey} after ${MAX_SYNC_ATTEMPTS} attempts`,
          error,
        );
      }
    }
  } finally {
    flushing = false;
  }
}

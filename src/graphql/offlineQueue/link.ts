import {ApolloLink, Observable} from '@apollo/client';
import {store} from '../../redux/store';
import {enqueued} from '../../redux/outbox/slice';
import {OfflineMutationKey} from '../../types/offlineQueue';
import {connectivity} from './connectivity';
import {OFFLINE_MUTATIONS} from './registry';

function isRegisteredKey(value: unknown): value is OfflineMutationKey {
  return typeof value === 'string' && value in OFFLINE_MUTATIONS;
}

/**
 * Sits before `transportLink` in the chain (see client.ts), so it's blind to
 * whether the feature it intercepts is on 'mock' or 'graphql' — queueing
 * behaves identically either way. Only mutations that opt in via
 * `context: {offlineQueueKey}` are ever intercepted; everything else is
 * forwarded untouched, online or not.
 */
export const offlineQueueLink = new ApolloLink((operation, forward) => {
  const offlineQueueKey = operation.getContext().offlineQueueKey;
  if (!isRegisteredKey(offlineQueueKey) || connectivity.isOnline()) {
    return forward(operation);
  }

  const entry = OFFLINE_MUTATIONS[offlineQueueKey];
  const localId = `outbox_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  store.dispatch(
    enqueued({
      id: localId,
      mutationKey: offlineQueueKey,
      variables: operation.variables,
      createdAt: new Date().toISOString(),
    }),
  );

  return new Observable(observer => {
    observer.next({data: entry.buildOptimisticData(localId)});
    observer.complete();
  });
});

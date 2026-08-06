/**
 * The mutations currently routed through the offline queue. Extend this
 * union — and `OFFLINE_MUTATIONS` in `graphql/offlineQueue/registry.ts` —
 * as more create flows opt in.
 */
export type OfflineMutationKey =
  | 'CREATE_WORK_LOG_ENTRY'
  | 'CREATE_FIXTURE'
  | 'CREATE_MAINTENANCE_REQUEST'
  | 'CREATE_INCIDENT'
  | 'CREATE_POI'
  | 'ADD_POI_INTERACTION'
  | 'ADD_POI_UPDATE';

export interface OutboxItem {
  /** Locally generated when queued (`outbox_...`) — never a server id. */
  id: string;
  mutationKey: OfflineMutationKey;
  /** The exact GraphQL variables the mutation was called with. */
  variables: Record<string, unknown>;
  /** ISO-8601, when it was queued — not when it eventually syncs. */
  createdAt: string;
}

export interface OutboxState {
  items: OutboxItem[];
}

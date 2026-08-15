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
  | 'ADD_POI_UPDATE'
  | 'CREATE_EQUIPMENT'
  | 'CHECK_OUT_EQUIPMENT'
  | 'CHECK_IN_EQUIPMENT'
  | 'ADD_EQUIPMENT_UPKEEP';

export interface OutboxItem {
  /** Locally generated when queued (`outbox_...`) — never a server id. */
  id: string;
  mutationKey: OfflineMutationKey;
  /** The exact GraphQL variables the mutation was called with. */
  variables: Record<string, unknown>;
  /** ISO-8601, when it was queued — not when it eventually syncs. */
  createdAt: string;
  /** Sync attempts made so far. Reset to 0 when the user retries. */
  attempts: number;
  /** Message from the most recent failed attempt, for the retry UI. */
  lastError: string | null;
}

export interface OutboxState {
  items: OutboxItem[];
  /**
   * Items that exhausted MAX_SYNC_ATTEMPTS. Held out of `items` so a
   * permanently-failing create cannot block everything queued behind it, and
   * kept rather than dropped so the user can retry or discard it.
   */
  failed: OutboxItem[];
}

export type WorkStatus = 'Open' | 'In-progress' | 'Completed';
export type WorkPriority = 'High' | 'Medium' | 'Low';
export type WorkBucket = 'assigned' | 'unassigned' | 'completed';
export type WorkCategory = 'Maintenance' | 'Incident' | 'Fixture' | 'POI' | 'Activity';

export interface WorkItem {
  /** Opaque server identifier. Never displayed — use `reference` for that. */
  id: string;
  /** Display ticket number, carrying its own '#' prefix, e.g. '#96222110'. */
  reference: string;
  category: WorkCategory;
  status: WorkStatus;
  date: string; // ISO-8601
  type: string; // e.g. 'Alley Cleaning'
  priority: WorkPriority;
  zone: string;
  assignee: string;
  assigneeInitials: string;
  address: string;
  bucket: WorkBucket;
  /**
   * Completed-card detail fields — which ones apply depends on `category`
   * (Incident's "Outcome", Fixture's "Status", POI's "Interaction"/
   * "Disposition", Activity's "Business"/"Quantity"). See
   * `screens/work/components/WorkCard.tsx`'s `completedFields`.
   */
  outcome?: string;
  interaction?: string;
  disposition?: string;
  businessName?: string;
  quantity?: string;
  /**
   * Client-only, unlike Fixture/Maintenance's server-modeled `queuedOffline`
   * field — a real Work Log record from the server is never marked queued.
   * Only set (`true`) on the synthetic placeholder `usePendingWorkLogItems`
   * builds for an entry still sitting in the outbox.
   */
  queuedOffline?: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  /** Fill behind the icon. */
  tint: string;
  /** Icon stroke, normally a deeper shade of the tint. */
  iconColor: string;
  /** Key into QuickActions' icon map; unknown keys fall back to a generic one. */
  icon: string;
}

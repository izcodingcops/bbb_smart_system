export type WorkStatus = 'Open' | 'In-progress' | 'Completed';
export type WorkPriority = 'High' | 'Medium' | 'Low';
export type WorkBucket = 'assigned' | 'completed';
export type WorkCategory = 'Maintenance' | 'Incident' | 'Fixture' | 'POI' | 'Activity';

export interface WorkItem {
  id: string; // ticket number, e.g. '#96211407'
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

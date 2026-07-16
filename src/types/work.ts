export type WorkStatus = 'Open' | 'In-progress' | 'Completed';
export type WorkPriority = 'High' | 'Medium' | 'Low';
export type WorkBucket = 'assigned' | 'completed';

export interface WorkItem {
  id: string; // ticket number, e.g. '#96211407'
  category: string; // e.g. 'Maintenance'
  status: WorkStatus;
  date: string; // human-readable timestamp
  type: string; // e.g. 'Alley Cleaning'
  priority: WorkPriority;
  assignee: string;
  assigneeInitials: string;
  address: string;
  bucket: WorkBucket;
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

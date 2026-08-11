export type MaintenanceStatus = 'Open' | 'In-progress' | 'Completed';
export type MaintenancePriority = 'Low' | 'Medium' | 'High';
export type MaintenanceAssigneeKind = 'Supervisor' | 'Department';

export interface MaintenanceAssignee {
  name: string;
  initials: string;
}

export interface MaintenanceRequest {
  /** Opaque server identifier. Never displayed — use `reference` for that. */
  id: string;
  /** Display reference, carrying its own '#' prefix, e.g. '#MT-40877'. */
  reference: string;
  type: string;
  status: MaintenanceStatus;
  requestedAt: string;
  businessName: string;
  priority: MaintenancePriority;
  assignee: MaintenanceAssignee | null;
  address: string;
  routedToSupervisor: boolean;
  queuedOffline: boolean;
  completedBy: string | null;
  assigneeKind: MaintenanceAssigneeKind;
  department: string | null;
}

export interface MaintenanceComment {
  id: string;
  createdAt: string;
  text: string;
  edited: boolean;
  images: string[];
}

/** Everything the View/Edit screens show beyond the list card. */
export interface MaintenanceDetail extends MaintenanceRequest {
  ambassador: string;
  programName: string;
  programCode: string;
  createdBy: string;
  completedOn: string | null;
  paid: boolean;
  zone: string | null;
  describeLocation: string | null;
  description: string | null;
  documents: string[];
  fixture: string | null;
  incidents: string[];
  pois: string[];
  equipment: string[];
  comments: MaintenanceComment[];
}

/** What the Create/Edit form edits and submits. */
export interface MaintenanceFormValues {
  type: string;
  requestedAt: string;
  assigneeKind: MaintenanceAssigneeKind;
  department: string | null;
  priority: MaintenancePriority;
  address: string;
  zone: string | null;
  describeLocation: string;
  businessName: string | null;
  description: string;
  documents: string[];
  fixture: string | null;
  incidents: string[];
  pois: string[];
  equipment: string[];
}

export interface MaintenanceFormOptions {
  nextReference: string;
  types: string[];
  zones: string[];
  departments: string[];
  ambassadors: string[];
  businessNames: string[];
  fixtures: string[];
  incidents: string[];
  pois: string[];
  equipment: string[];
  fixtureTypes: string[];
}

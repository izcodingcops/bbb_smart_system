export type MaintenanceStatus = 'Open' | 'In-progress' | 'Completed';
export type MaintenancePriority = 'Low' | 'Medium' | 'High';
/**
 * Who a request is being handed to. Which of these a user may pick is
 * role-gated by the form: an ambassador routes to a `Supervisor` or a
 * `Department`; a supervisor assigns directly to an `Ambassador`, a
 * `Department`, or themselves (`Me`) — a supervisor is an ambassador too, so
 * self-assignment produces an ordinary assigned record.
 */
export type MaintenanceAssigneeKind =
  | 'Supervisor'
  | 'Department'
  | 'Ambassador'
  | 'Me';

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
  createdBy: string;
}

export interface MaintenanceComment {
  id: string;
  createdAt: string;
  text: string;
  edited: boolean;
  images: string[];
}

/**
 * Still awaiting a supervisor's triage: an ambassador routed it upward and
 * nobody has been named yet. Shared by the Work tab's Unassigned bucket and
 * the detail screen's "Choose assignee" affordance so the two can never
 * disagree about which records are claimable.
 */
export function isUnassignedMaintenance(
  record: Pick<MaintenanceRequest, 'assignee' | 'assigneeKind' | 'status'>,
): boolean {
  return (
    record.assigneeKind === 'Supervisor' &&
    !record.assignee &&
    record.status !== 'Completed'
  );
}

/** Everything the View/Edit screens show beyond the list card. */
export interface MaintenanceDetail extends MaintenanceRequest {
  programName: string;
  programCode: string;
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
  /** The chosen ambassador's name; only set when `assigneeKind` is 'Ambassador'. */
  ambassador: string | null;
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

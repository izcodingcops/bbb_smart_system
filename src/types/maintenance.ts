export type MaintenanceStatus = 'Open' | 'In-progress' | 'Completed';
export type MaintenancePriority = 'Low' | 'Medium' | 'High';

export interface MaintenanceAssignee {
  name: string;
  initials: string;
}

export interface MaintenanceRequest {
    id: string;
    type: string;
    status: MaintenanceStatus;
    requestedAt: string;
    businessName: string;
    priority: MaintenancePriority;
    assignee: MaintenanceAssignee | null;
    address: string;
    routedToSupervisor: boolean;
    queuedOffline: boolean; 
}
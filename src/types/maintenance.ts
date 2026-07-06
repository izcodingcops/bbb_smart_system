export interface MaintenanceDropdownOption {
  id: string | number;
  label: string;
}

export interface MaintenanceDropdowns {
  types: MaintenanceDropdownOption[];
  departments: MaintenanceDropdownOption[];
  ambassadors: MaintenanceDropdownOption[];
  businesses: MaintenanceDropdownOption[];
  zones: MaintenanceDropdownOption[];
}

export type MaintenancePriority = 'Low' | 'Medium' | 'High';
export type MaintenanceAssigneeType = 'Ambassador' | 'Department';
export type MaintenanceStatus = 'Open' | 'InProgress' | 'Completed' | 'Pending';

export interface MaintenanceImage {
  uri: string;
  name: string;
  type: string;
}

export interface MaintenancePayload {
  maintenance_type_id: string | number;
  request_date: string;
  assignee_type: MaintenanceAssigneeType;
  user_id?: string | number;
  department_id?: string | number;
  priority: MaintenancePriority;
  address: string;
  zone_id?: string | number;
  location_description?: string;
  business_location?: string | number;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface MaintenanceRecord extends MaintenancePayload {
  id: string;
  ticket_number: string;
  status: MaintenanceStatus;
  program_name?: string;
  created_by?: string;
  completed_by?: string | null;
  completed_on?: string | null;
  payment_status?: 'Paid' | 'Un-Paid';
  created_at: string;
}

export interface MaintenanceComment {
  id: string;
  text: string;
  created_at: string;
  created_by?: string;
}

export interface MaintenanceListFilters {
  search?: string;
  type?: string;
  business?: string;
  priority?: string;
  status?: string;
}

export interface MaintenanceState {
  list: MaintenanceRecord[];
  listLoading: boolean;
  listError: string | null;
  filters: MaintenanceListFilters;
  selected: MaintenanceRecord | null;
  selectedLoading: boolean;
  dropdowns: MaintenanceDropdowns;
  dropdownsLoading: boolean;
  isSubmitting: boolean;
  submitError: string | null;
}

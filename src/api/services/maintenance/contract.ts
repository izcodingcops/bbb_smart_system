import {
  MaintenanceRecord,
  MaintenancePayload,
  MaintenanceDropdowns,
  MaintenanceListFilters,
  MaintenanceComment,
} from '../../../types/maintenance';

export interface MaintenanceListResponse {
  status: number;
  data: {count: number; rows: MaintenanceRecord[]};
}

export interface MaintenanceDetailResponse {
  status: number;
  data: MaintenanceRecord;
}

export interface MaintenanceDropdownsResponse {
  status: number;
  data: MaintenanceDropdowns;
}

export interface MaintenanceServiceContract {
  list: (page: number, filters: MaintenanceListFilters) => Promise<MaintenanceListResponse>;
  detail: (id: string) => Promise<MaintenanceDetailResponse>;
  create: (payload: MaintenancePayload) => Promise<MaintenanceDetailResponse>;
  update: (id: string, payload: MaintenancePayload) => Promise<MaintenanceDetailResponse>;
  remove: (id: string) => Promise<{status: number}>;
  getDropdowns: () => Promise<MaintenanceDropdownsResponse>;
  addComment: (id: string, text: string) => Promise<{status: number; data: MaintenanceComment}>;
}

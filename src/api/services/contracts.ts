/**
 * Service contracts (repository-pattern interfaces).
 *
 * Each service (maintenanceService, authService, ...) has exactly one
 * interface here. A "live<Name>Service" (axios-backed) and a
 * "mock<Name>Service" (in-memory) both implement it, and are typed against
 * it with `satisfies` — if either drifts from the other's shape, the
 * compiler catches it. The service file itself picks which implementation
 * to export based on src/config/apiMocks.ts.
 */
import {
  MaintenanceRecord,
  MaintenancePayload,
  MaintenanceDropdowns,
  MaintenanceListFilters,
  MaintenanceComment,
} from '../../types/maintenance';

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

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
import {LoginCredentials, LoginResponse} from '../../types/auth';
import {
  MaintenanceRecord,
  MaintenancePayload,
  MaintenanceDropdowns,
  MaintenanceListFilters,
  MaintenanceComment,
} from '../../types/maintenance';
import {ProgramListResponse, SelectProgramResponse, TaskItem} from '../../types/program';

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

export interface AuthServiceContract {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
}

export interface ProgramTaskListResponse {
  status: number;
  message?: string;
  data: {count: number; rows: TaskItem[]};
}

export interface ProgramServiceContract {
  listPrograms: () => Promise<ProgramListResponse>;
  getTaskList: (programId: string | number) => Promise<ProgramTaskListResponse>;
  selectProgram: (
    programId: string | number,
    shiftId: string | number,
  ) => Promise<SelectProgramResponse>;
}

export interface StartShiftBody {
  actual_shift_date: string;
  actual_shift_end_date: string;
  task_id: string | number;
  program_id: string | number;
  timezone_str: string;
  server_date: string;
}

export interface ShiftServiceContract {
  startShift: (body: StartShiftBody) => Promise<{status: number; data: any}>;
}

export interface GeoDataBody {
  sessionId: string | number;
  latitude: number;
  longitude: number;
  deviceId: string;
  deviceType: string;
  deviceName: string;
  shiftId: string | number;
  horizontal_accuracy: number;
  user_id: string | number;
}

export interface LocationServiceContract {
  addGeoData: (body: GeoDataBody) => Promise<{status: number; data: any}>;
}

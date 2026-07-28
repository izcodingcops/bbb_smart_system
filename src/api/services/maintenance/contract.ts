import {MaintenanceRequest} from "../../../types/maintenance";

export interface MaintenanceListResponse {
  status: number;
  data: MaintenanceRequest[];
}

export interface MaintenanceServiceContract {
  getMaintenanceRequests: () => Promise<MaintenanceListResponse>;
}
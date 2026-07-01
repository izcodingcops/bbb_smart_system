import client from '../index';
import {ApiEndpoints} from '../apiEndpoints';
import {
  MaintenanceRecord,
  MaintenancePayload,
  MaintenanceDropdowns,
  MaintenanceListFilters,
  MaintenanceComment,
} from '../../types/maintenance';

interface MaintenanceListResponse {
  status: number;
  data: {count: number; rows: MaintenanceRecord[]};
}

interface MaintenanceDetailResponse {
  status: number;
  data: MaintenanceRecord;
}

interface MaintenanceDropdownsResponse {
  status: number;
  data: MaintenanceDropdowns;
}

export const maintenanceService = {
  list: (page: number, filters: MaintenanceListFilters): Promise<MaintenanceListResponse> => {
    const params = new URLSearchParams({page: String(page), app: 'true'});
    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);
    if (filters.business) params.append('business', filters.business);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.status) params.append('status', filters.status);
    return client.get(`${ApiEndpoints.maintenanceList}?${params.toString()}`).then(r => r.data);
  },

  detail: (id: string): Promise<MaintenanceDetailResponse> =>
    client.get(`${ApiEndpoints.maintenanceBase}/${id}`).then(r => r.data),

  create: (payload: MaintenancePayload): Promise<MaintenanceDetailResponse> =>
    client
      .post(ApiEndpoints.maintenanceBase, payload, {offlineQueueable: true} as any)
      .then(r => r.data),

  update: (id: string, payload: MaintenancePayload): Promise<MaintenanceDetailResponse> =>
    client.put(`${ApiEndpoints.maintenanceBase}/${id}`, payload).then(r => r.data),

  remove: (id: string): Promise<{status: number}> =>
    client.delete(`${ApiEndpoints.maintenanceBase}/${id}`).then(r => r.data),

  getDropdowns: (): Promise<MaintenanceDropdownsResponse> =>
    client.get(ApiEndpoints.maintenanceDropdowns).then(r => r.data),

  addComment: (id: string, text: string): Promise<{status: number; data: MaintenanceComment}> =>
    client.post(ApiEndpoints.maintenanceComment, {maintenance_id: id, text}).then(r => r.data),
};

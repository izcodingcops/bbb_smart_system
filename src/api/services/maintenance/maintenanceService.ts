import client from '../../index';
import {ApiEndpoints} from '../../apiEndpoints';
import {MaintenancePayload, MaintenanceListFilters} from '../../../types/maintenance';
import {API_MOCKS} from '../../../config/apiMocks';
import {mockMaintenanceService} from './mockMaintenanceService';
import {cacheFirstOnFailure} from '../../../utils/apiCache';
import {throwIfSimulatingOffline} from '../../../utils/devOffline';
import {
  maintenanceListCacheKey,
  maintenanceDetailCacheKey,
  MAINTENANCE_DROPDOWNS_CACHE_KEY,
} from './cacheKeys';
import {
  MaintenanceServiceContract,
  MaintenanceListResponse,
  MaintenanceDetailResponse,
  MaintenanceDropdownsResponse,
} from './contract';

const liveMaintenanceService = {
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

  addComment: (id: string, text: string) =>
    client.post(ApiEndpoints.maintenanceComment, {maintenance_id: id, text}).then(r => r.data),
} satisfies MaintenanceServiceContract;

const selectedMaintenanceService: MaintenanceServiceContract = API_MOCKS.maintenance
  ? mockMaintenanceService
  : liveMaintenanceService;

/**
 * Wraps reads with cache-first-on-failure and every offline-sensitive
 * method with the dev-only simulated-offline guard. Wrapping happens after
 * mock/live selection so the same offline behavior is exercised in both
 * modes — this is what lets the whole offline path be tested end-to-end
 * against mock data before the live backend is wired (flip
 * `DEV_FLAGS.simulateOffline` in src/utils/devOffline.ts).
 */
export const maintenanceService: MaintenanceServiceContract = {
  ...selectedMaintenanceService,
  list: (page, filters) =>
    cacheFirstOnFailure(maintenanceListCacheKey(page, filters), () => {
      throwIfSimulatingOffline();
      return selectedMaintenanceService.list(page, filters);
    }),
  detail: id =>
    cacheFirstOnFailure(maintenanceDetailCacheKey(id), () => {
      throwIfSimulatingOffline();
      return selectedMaintenanceService.detail(id);
    }),
  getDropdowns: () =>
    cacheFirstOnFailure(MAINTENANCE_DROPDOWNS_CACHE_KEY, () => {
      throwIfSimulatingOffline();
      return selectedMaintenanceService.getDropdowns();
    }),
  create: payload => {
    throwIfSimulatingOffline();
    return selectedMaintenanceService.create(payload);
  },
};

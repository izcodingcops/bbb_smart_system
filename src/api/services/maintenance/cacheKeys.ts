import {MaintenanceListFilters} from '../../../types/maintenance';

export function maintenanceListCacheKey(page: number, filters: MaintenanceListFilters): string {
  const parts = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);
  return `maintenance_list:${page}:${parts.join('&')}`;
}

export function maintenanceDetailCacheKey(id: string): string {
  return `maintenance_detail:${id}`;
}

export const MAINTENANCE_DROPDOWNS_CACHE_KEY = 'maintenance_dropdowns';

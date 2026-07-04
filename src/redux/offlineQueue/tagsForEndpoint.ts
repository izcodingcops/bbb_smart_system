type ApiTag = 'Programs' | 'MenuItems' | 'MaintenanceList' | 'MaintenanceDetail' | 'MaintenanceDropdowns';

const ENDPOINT_TAGS: Record<string, ApiTag[]> = {
  'addMaintenance-v2': ['MaintenanceList'],
};

export function tagsForEndpoint(endpoint: string): ApiTag[] {
  return ENDPOINT_TAGS[endpoint] ?? [];
}

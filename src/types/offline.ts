export type OfflineBaseUrl = 'APP' | 'WEB';

export interface OfflineFile {
  fieldKey: string;
  uri: string;
  name: string;
  type: string;
}

export interface OfflineRecord {
  id: string;
  endpoint: string;
  baseUrl: OfflineBaseUrl;
  payload: Record<string, unknown>;
  files: OfflineFile[];
  createdAt: string;
  retryCount: number;
}

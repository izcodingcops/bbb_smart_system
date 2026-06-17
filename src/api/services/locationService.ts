import client from '../index';
import {ApiEndpoints} from '../apiEndpoints';

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

export const locationService = {
  addGeoData: (body: GeoDataBody): Promise<{status: number; data: any}> =>
    client.post(ApiEndpoints.addGeoData, body).then(r => r.data),
};

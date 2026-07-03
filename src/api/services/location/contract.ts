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

import {mockLocationService} from './mockLocationService';

describe('mockLocationService.addGeoData', () => {
  test('resolves 200 and echoes the session and shift ids', async () => {
    const response = await mockLocationService.addGeoData({
      sessionId: 'session-1',
      latitude: 45.5,
      longitude: -73.6,
      deviceId: 'device-1',
      deviceType: 'ios',
      deviceName: 'iPhone',
      shiftId: 'shift-1',
      horizontal_accuracy: 5,
      user_id: 'user-1',
    });

    expect(response.status).toBe(200);
    expect(response.data.sessionId).toBe('session-1');
  });
});

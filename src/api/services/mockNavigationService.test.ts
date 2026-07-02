import {mockNavigationService} from './mockNavigationService';

describe('mockNavigationService.getMenuItems', () => {
  test('resolves the seeded menu list', async () => {
    const response = await mockNavigationService.getMenuItems();
    expect(response.status).toBe(200);
    expect(response.data.some(item => item.screen_name === 'Home')).toBe(true);
  });
});

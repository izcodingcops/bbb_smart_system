import {mockAuthService} from './mockAuthService';

describe('mockAuthService.login', () => {
  test('resolves a session for matching credentials', async () => {
    const response = await mockAuthService.login({
      username: 'johndoe',
      password: 'password123',
      login_type: 1,
    });

    expect(response.status).toBe(200);
    expect(response.data.username).toBe('johndoe');
    expect(response.data.token).not.toBe('');
  });

  test('rejects with a 404 status for unknown credentials', async () => {
    const response = await mockAuthService.login({
      username: 'nobody',
      password: 'wrong',
      login_type: 1,
    });

    expect(response.status).toBe(404);
    expect(response.data.token).toBe('');
  });
});

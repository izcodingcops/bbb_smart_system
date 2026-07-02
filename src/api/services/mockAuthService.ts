import {LoginCredentials, LoginResponse} from '../../types/auth';
import {MOCK_USERS} from '../../constants';
import {AuthServiceContract} from './contracts';

const MOCK_DELAY = 800;

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
}

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const mockAuthService = {
  login: (credentials: LoginCredentials): Promise<LoginResponse> => {
    const match = MOCK_USERS.find(
      u => u.username === credentials.username && u.password === credentials.password,
    );

    if (!match) {
      return delay({
        status: 404,
        message: 'Invalid username or password.',
        data: {token: '', enable_shift_entry: false, id: '', name: '', username: ''},
      });
    }

    return delay({
      status: 200,
      message: 'Login successful.',
      data: {
        token: generateToken(),
        enable_shift_entry: match.enable_shift_entry,
        id: match.id,
        name: match.name,
        username: match.username,
        email: match.email,
        avatar: match.avatar,
      },
    });
  },
} satisfies AuthServiceContract;

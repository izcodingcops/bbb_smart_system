import {LoginCredentials, LoginResponse} from '../types/auth';
import {ProgramListResponse} from '../types/program';
import {MenuItem} from '../types/navigation';
import {MOCK_USERS, MOCK_PROGRAMS, MOCK_MENU_ITEMS} from '../constants';

const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(() => resolve(), ms));

const generateToken = (): string =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);

export const authRepository = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    await delay(800);

    const match = MOCK_USERS.find(
      u => u.username === credentials.username && u.password === credentials.password,
    );

    if (!match) {
      return {
        status: 404,
        message: 'Invalid username or password.',
        data: {token: '', enable_shift_entry: false, id: '', name: '', username: ''},
      };
    }

    return {
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
    };
  },

  async logout(_token: string): Promise<void> {
    await delay(300);
  },
};

export const programRepository = {
  async listPrograms(): Promise<ProgramListResponse> {
    await delay(600);
    return {status: 200, data: MOCK_PROGRAMS};
  },
};

export const navigationRepository = {
  async getMenuItems(): Promise<MenuItem[]> {
    await delay(400);
    return MOCK_MENU_ITEMS as MenuItem[];
  },
};

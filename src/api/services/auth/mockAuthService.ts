import {
  LoginCredentials,
  LoginResponse,
  PasswordResetResponse,
} from '../../../types/auth';
import {MOCK_USERS, MOCK_SHIFT_TYPES} from '../../../constants';
import {AuthServiceContract} from './contract';

const MOCK_DELAY = 800;

// Fixed code the mock treats as the "sent" OTP so the flow is testable.
const MOCK_RESET_CODE = '111111';

function isRegisteredEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return MOCK_USERS.some(u => (u.email ?? '').toLowerCase() === e);
}

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
        programs: match.programs,
        shift_types: MOCK_SHIFT_TYPES,
      },
    });
  },

  requestPasswordReset: (email: string): Promise<PasswordResetResponse> => {
    if (!isRegisteredEmail(email)) {
      return delay({
        status: 404,
        message: 'No account is registered with this email.',
      });
    }
    return delay({status: 200, message: 'Verification code sent.'});
  },

  verifyResetOtp: (
    _email: string,
    code: string,
  ): Promise<PasswordResetResponse> => {
    if (code !== MOCK_RESET_CODE) {
      return delay({
        status: 400,
        message: 'That code is incorrect. Please check and try again.',
      });
    }
    return delay({status: 200, message: 'Code verified.'});
  },

  resetPassword: (
    _email: string,
    code: string,
    _newPassword: string,
  ): Promise<PasswordResetResponse> => {
    if (code !== MOCK_RESET_CODE) {
      return delay({status: 400, message: 'Verification failed.'});
    }
    return delay({status: 200, message: 'Password reset successfully.'});
  },
} satisfies AuthServiceContract;

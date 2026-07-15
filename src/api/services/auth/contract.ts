import {
  LoginCredentials,
  LoginResponse,
  PasswordResetResponse,
} from '../../../types/auth';

export interface AuthServiceContract {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  requestPasswordReset: (email: string) => Promise<PasswordResetResponse>;
  verifyResetOtp: (
    email: string,
    code: string,
  ) => Promise<PasswordResetResponse>;
  resetPassword: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<PasswordResetResponse>;
}

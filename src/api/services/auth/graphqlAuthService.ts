import {
  LoginCredentials,
  LoginResponse,
  PasswordResetResponse,
} from '../../../types/auth';
import {AuthServiceContract} from './contract';

/**
 * GraphQL implementation of the auth contract. Not yet wired to a schema —
 * throws so switching API_TRANSPORT.auth to 'graphql' fails loudly. Replace
 * the bodies with graphqlClient.request(...) mutations when the backend lands.
 */
export const graphqlAuthService = {
  login: (_credentials: LoginCredentials): Promise<LoginResponse> => {
    throw new Error('graphqlAuthService.login not implemented yet');
  },
  requestPasswordReset: (_email: string): Promise<PasswordResetResponse> => {
    throw new Error('graphqlAuthService.requestPasswordReset not implemented yet');
  },
  verifyResetOtp: (
    _email: string,
    _code: string,
  ): Promise<PasswordResetResponse> => {
    throw new Error('graphqlAuthService.verifyResetOtp not implemented yet');
  },
  resetPassword: (
    _email: string,
    _code: string,
    _newPassword: string,
  ): Promise<PasswordResetResponse> => {
    throw new Error('graphqlAuthService.resetPassword not implemented yet');
  },
} satisfies AuthServiceContract;

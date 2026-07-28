import {apolloClient} from '../../client';
import {
  LoginCredentials,
  LoginResult,
  RequestPasswordResetResult,
  ResetPasswordResult,
  VerifyResetCodeResult,
} from '../../../types/auth';
import {
  LOGIN,
  REQUEST_PASSWORD_RESET,
  RESET_PASSWORD,
  VERIFY_RESET_CODE,
} from './documents';

const context = {feature: 'auth' as const};

/**
 * Auth mutations are fire-and-forget with respect to the cache — the session
 * lives in redux — so they use `no-cache` and never write normalised entities.
 */
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResult> => {
    const {data} = await apolloClient.mutate<{login: LoginResult}>({
      mutation: LOGIN,
      context,
      fetchPolicy: 'no-cache',
      variables: {
        input: {
          username: credentials.username,
          password: credentials.password,
          loginType: credentials.login_type,
        },
      },
    });
    return data!.login;
  },

  requestPasswordReset: async (email: string): Promise<RequestPasswordResetResult> => {
    const {data} = await apolloClient.mutate<{
      requestPasswordReset: RequestPasswordResetResult;
    }>({mutation: REQUEST_PASSWORD_RESET, context, fetchPolicy: 'no-cache', variables: {email}});
    return data!.requestPasswordReset;
  },

  verifyResetCode: async (email: string, code: string): Promise<VerifyResetCodeResult> => {
    const {data} = await apolloClient.mutate<{
      verifyResetCode: VerifyResetCodeResult;
    }>({mutation: VERIFY_RESET_CODE, context, fetchPolicy: 'no-cache', variables: {email, code}});
    return data!.verifyResetCode;
  },

  resetPassword: async (
    email: string,
    code: string,
    newPassword: string,
  ): Promise<ResetPasswordResult> => {
    const {data} = await apolloClient.mutate<{resetPassword: ResetPasswordResult}>({
      mutation: RESET_PASSWORD,
      context,
      fetchPolicy: 'no-cache',
      variables: {input: {email, code, newPassword}},
    });
    return data!.resetPassword;
  },
};

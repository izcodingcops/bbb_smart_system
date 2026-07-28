import {useCallback, useState} from 'react';
import {authApi} from '../graphql/features/auth/hooks';
import {logger} from '../utils/logger';

/** What the screens need: did it work, and what to show if not. */
export interface ResetOutcome {
  ok: boolean;
  message: string;
}

/**
 * Drives request code -> verify OTP -> set new password. Each call returns a
 * union; this is the one place that flattens "which member came back" into the
 * ok/message pair the screens render, and turns a thrown transport error into
 * the same shape so callers never face an unhandled rejection.
 */
export const usePasswordReset = () => {
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(
    async (
      fn: () => Promise<{__typename: string; message?: string}>,
      successType: string,
      successMessage: string,
    ): Promise<ResetOutcome> => {
      setIsLoading(true);
      try {
        const result = await fn();
        return result.__typename === successType
          ? {ok: true, message: successMessage}
          : {ok: false, message: result.message ?? 'Something went wrong.'};
      } catch (error: any) {
        logger.error('usePasswordReset', 'Password reset request failed', error);
        return {ok: false, message: 'Something went wrong. Please try again.'};
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const requestCode = useCallback(
    (email: string) =>
      run(() => authApi.requestPasswordReset(email), 'PasswordResetRequested', 'Verification code sent.'),
    [run],
  );

  const verifyCode = useCallback(
    (email: string, code: string) =>
      run(() => authApi.verifyResetCode(email, code), 'ResetCodeVerified', 'Code verified.'),
    [run],
  );

  const resetPassword = useCallback(
    (email: string, code: string, newPassword: string) =>
      run(() => authApi.resetPassword(email, code, newPassword), 'PasswordChanged', 'Password reset successfully.'),
    [run],
  );

  return {isLoading, requestCode, verifyCode, resetPassword};
};

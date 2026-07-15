import {useCallback, useState} from 'react';
import {authService} from '../api/services/auth/authService';
import {PasswordResetResponse} from '../types/auth';

/**
 * Drives the forgot-password flow (request code → verify OTP → set new
 * password) with a shared loading flag. Each call resolves to the service
 * response so screens can branch on status/message.
 */
export const usePasswordReset = () => {
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(
    async (
      fn: () => Promise<PasswordResetResponse>,
    ): Promise<PasswordResetResponse> => {
      setIsLoading(true);
      try {
        return await fn();
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const requestCode = useCallback(
    (email: string) => run(() => authService.requestPasswordReset(email)),
    [run],
  );

  const verifyCode = useCallback(
    (email: string, code: string) =>
      run(() => authService.verifyResetOtp(email, code)),
    [run],
  );

  const resetPassword = useCallback(
    (email: string, code: string, newPassword: string) =>
      run(() => authService.resetPassword(email, code, newPassword)),
    [run],
  );

  return {isLoading, requestCode, verifyCode, resetPassword};
};

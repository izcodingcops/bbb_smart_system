import {logger} from '../../utils/logger';

type QueryFnResult<T> = {data: T} | {error: {message: string}};

/**
 * Wraps a fetch-and-return function with the log-then-format-error pattern
 * every RTK Query `queryFn` in this app needs. Collapses each endpoint down
 * to "what to fetch"; endpoints with genuinely special error handling (e.g.
 * maintenance's `create`, which branches into an offline-queue path) keep
 * their own try/catch instead of using this.
 */
export async function withErrorLogging<T>(
  source: string,
  fallbackMessage: string,
  fn: () => Promise<T>,
): Promise<QueryFnResult<T>> {
  try {
    return {data: await fn()};
  } catch (error: any) {
    logger.error(source, fallbackMessage, error);
    return {error: {message: error?.message ?? fallbackMessage}};
  }
}

/**
 * Narrows an RTK Query hook's `error` field (typed `{message: string} |
 * SerializedError | undefined` for endpoints on this app's apiSlice) down to
 * a displayable string, without an `as any` cast at the call site.
 */
export function getErrorMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as {message?: unknown}).message === 'string'
  ) {
    return (error as {message: string}).message;
  }
  return null;
}

/** token -> user id, so `me` resolves the way a real gateway would. */
const sessions = new Map<string, string>();

export interface MockContext {
  token: string | null;
}

export function issueToken(userId: string): string {
  const token = `tok_${userId}_${Date.now().toString(36)}`;
  sessions.set(token, userId);
  return token;
}

export function userIdForToken(token: string | null): string | undefined {
  return token ? sessions.get(token) : undefined;
}

export const MOCK_DELAY = 400;

export const sleep = (ms: number = MOCK_DELAY): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

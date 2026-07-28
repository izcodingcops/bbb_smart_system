/**
 * Holds the bearer token outside redux so the Apollo link can read it without
 * importing the store (store -> auth slice -> client -> store would be a
 * cycle). Redux stays the source of truth and pushes into here.
 */
let token: string | null = null;

export const authToken = {
  get: (): string | null => token,
  set: (next: string | null): void => {
    token = next;
  },
};

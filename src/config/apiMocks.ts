/**
 * Per-feature flags to swap a real API-backed service for an in-memory mock.
 * Flip back to `false` once the corresponding backend endpoints are ready.
 */
export const API_MOCKS = {
  maintenance: true,
};

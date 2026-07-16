/**
 * Per-feature transport switch. Flip a feature to 'graphql' once its
 * graphql<Feature>Service is wired to a real endpoint. Mock is the default
 * while there is no backend.
 */
export type Transport = 'mock' | 'graphql';

export const API_TRANSPORT: Record<'auth' | 'navigation' | 'work', Transport> = {
  auth: 'mock',
  navigation: 'mock',
  work: 'mock',
};

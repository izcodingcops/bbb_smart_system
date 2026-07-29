/**
 * Per-feature transport switch. Flip a feature to 'graphql' once the gateway
 * serves its part of the schema. Both paths execute the same documents, so this
 * only changes where they run.
 */
export type Transport = 'mock' | 'graphql';

export type Feature =
  | 'auth'
  | 'navigation'
  | 'work'
  | 'equipment'
  | 'maintenance'
  | 'fixture';

export const API_TRANSPORT: Record<Feature, Transport> = {
  auth: 'mock',
  navigation: 'mock',
  work: 'mock',
  equipment: 'mock',
  maintenance: 'mock',
  fixture: 'mock',
};

export const GRAPHQL_ENDPOINT = 'https://REPLACE_ME/graphql';

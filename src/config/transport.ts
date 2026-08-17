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
  | 'fixture'
  | 'incident'
  | 'dispatch'
  | 'poi'
  | 'workLog'
  | 'notification'
  | 'observationReport'
  | 'referenceDocument'
  | 'offHoursVisit';

export const API_TRANSPORT: Record<Feature, Transport> = {
  auth: 'mock',
  navigation: 'mock',
  work: 'mock',
  equipment: 'mock',
  maintenance: 'mock',
  fixture: 'mock',
  incident: 'mock',
  dispatch: 'mock',
  poi: 'mock',
  workLog: 'mock',
  notification: 'mock',
  observationReport: 'mock',
  referenceDocument: 'mock',
  offHoursVisit: 'mock',
};

export const GRAPHQL_ENDPOINT = 'https://REPLACE_ME/graphql';

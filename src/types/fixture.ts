export type FixtureStatus = 'Active' | 'Inactive';

export interface FixtureCreator {
  name: string;
  /** Two letters for the avatar circle, e.g. 'MB'. */
  initials: string;
}

export interface Fixture {
  /** Opaque server identifier. Never displayed — use `reference` for that. */
  id: string;
  /** Display reference, carrying its own '#' prefix, e.g. '#FX-42984'. */
  reference: string;
  title: string;
  fixtureType: string;
  zone: string;
  status: FixtureStatus;
  createdBy: FixtureCreator;
  /** A plain record field, not derived from live connectivity. */
  queuedOffline: boolean;
  /** ISO-8601. */
  createdAt: string;
  address: string;
}

/** Everything the View/Edit screens show beyond the list card. */
export interface FixtureDetail extends Fixture {
  describeLocation: string | null;
  /**
   * Mock-populated on create the same way `address` auto-fills — never
   * collected as a form field, only shown read-only in the detail view.
   */
  latitude: string | null;
  longitude: string | null;
  description: string | null;
  documents: string[];
}

/** What the Create/Edit form edits and submits. */
export interface FixtureFormValues {
  title: string;
  /** ISO-8601. */
  serviceDateTime: string;
  fixtureType: string;
  status: FixtureStatus;
  address: string;
  describeLocation: string;
  zone: string;
  description: string;
  documents: string[];
}

export interface FixtureFormOptions {
  nextReference: string;
  fixtureTypes: string[];
  zones: string[];
}

export type AmbassadorStatus = 'Active' | 'In-active' | 'Suspended';

/** The stored roster record — `src/mocks/ambassador.ts` and the store use this shape. */
export interface AmbassadorRecord {
  /** Opaque server identifier. Never displayed — use `reference` for that. */
  id: string;
  /** Display reference, e.g. '#27617'. */
  reference: string;
  name: string;
  username: string;
  jobTitle: string;
  status: AmbassadorStatus;
  points: number;
  cases: number;
  /** 0 means not rated yet. */
  rating: number;
  /** ISO-8601 datetime. */
  lastLoggedIn: string;
  badges: string[];
}

/**
 * What the app actually renders — the resolver's own output shape, and what
 * `hooks.ts` maps every query onto. `totalWork`/`totalReports` are
 * recomputed server-side from `AmbassadorWork`/`ObservationReport` on every
 * read, never stored, so they can't drift from what "View All Work"/"View
 * Past Reports" actually list. Shown on both the list card and the profile.
 */
export interface Ambassador extends AmbassadorRecord {
  totalWork: number;
  totalReports: number;
}

export type AmbassadorWorkType = 'Cleaning' | 'Maintenance';
export type AmbassadorWorkStatus = 'Completed' | 'In Progress' | 'Open';

export interface AmbassadorWork {
  /** Opaque server identifier. Never displayed — use `reference` for that. */
  id: string;
  /** Display reference, e.g. '#107799672'. */
  reference: string;
  ambassadorId: string;
  type: AmbassadorWorkType;
  /** 'Sub-Type' on a Cleaning card, 'Type' on a Maintenance card — same field. */
  subType: string;
  status: AmbassadorWorkStatus;
  /** Cleaning-only; Maintenance's priority is derived from this instead. */
  points: number;
  /** ISO-8601 datetime. */
  date: string;
  /** Shown on a Cleaning card; still present (often blank) on Maintenance rows. */
  businessName: string;
  /** Shown on a Cleaning card and in every record's Location Details. */
  quantity: string;
  zone: string;
  address: string;
  describeLocation: string;
  fixtureType: string | null;
  fixture: string | null;
  service: string;
}

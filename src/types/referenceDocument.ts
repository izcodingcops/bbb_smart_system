export interface ReferenceDocument {
  /** Opaque server identifier. Never displayed — use `reference` for that. */
  id: string;
  /** Display reference, e.g. '#107799687'. */
  reference: string;
  /** Sub-Type, e.g. 'Elevator Check'. */
  entryType: string;
  business: string;
  quantity: string;
  zone: string;
  /** ISO-8601 datetime — card date line and detail's 'Created At'. */
  dateTime: string;
  describe: string;
  fixtureType: string | null;
  fixture: string | null;
  service: string;
  assignedTo: string;
  createdBy: string;
  address: string;
}

export interface ReferenceDocumentFilterOptions {
  entryTypes: string[];
  businesses: string[];
  zones: string[];
}

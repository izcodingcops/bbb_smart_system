import {IncidentDetail} from './incident';

export type DispatchStatus = 'Open' | 'Escalated' | 'Closed';
export type DispatchPriority = 'Low' | 'Medium' | 'High';

/** The list card's shape. */
export interface Dispatch {
  /** Opaque server identifier. Never displayed — use `reference` for that. */
  id: string;
  /** Display reference, carrying its own prefix, e.g. '#BBB-D 0000-06'. */
  reference: string;
  typeOfActivity: string;
  howReferred: string;
  status: DispatchStatus;
  priority: DispatchPriority;
  /** ISO-8601. */
  createdAt: string;
  address: string;
}

/** One escalation on a dispatch — EMS, Police, Fire, etc. */
export interface DispatchEscalation {
  id: string;
  /** Header label, e.g. 'EMS'. */
  label: string;
  type: string;
  respondingPerson: string | null;
  /** ISO-8601, or null where the source reads 'N/A'. */
  timeCalled: string | null;
  timeArrived: string | null;
  timeCleared: string | null;
  /** Free-form on the wire: the source only ever shows 'Open'. */
  status: string;
  notes: string | null;
}

/** Everything the detail screen shows beyond the list card. */
export interface DispatchDetail extends Dispatch {
  /** Nullable: detail-only field, absent from the SDL's list selection set. */
  createdBy: string | null;
  sourceNotes: string | null;

  /** Nullable: detail-only field, absent from the SDL's list selection set. */
  location: string | null;
  locationNotes: string | null;

  tagSelected: string | null;
  classificationNotes: string | null;

  assignedRole: string | null;
  assignedIndividual: string | null;
  /** ISO-8601. */
  timeDispatched: string | null;
  timeArrived: string | null;
  timeCleared: string | null;
  initialOutcome: string | null;
  /** 'Yes' | 'No' on the wire; free-form here. */
  fullSquadResponse: string | null;
  outcomeNotes: string | null;

  escalations: DispatchEscalation[];
  /**
   * Resolver-computed via a join against the canonical incident store
   * (`i.dispatchReference === this.id`) — never stored on the dispatch
   * record itself. The mock's own stored value is always `[]` and is
   * overwritten before the response leaves the resolver; see
   * src/graphql/features/dispatch/resolvers.ts. Full detail, not the list
   * card's narrower shape — IncidentAccordion shows `createdBy` and
   * `description`, and "View More Detail" pushes the canonical
   * ViewIncidentScreen for the rest.
   */
  incidents: IncidentDetail[];
}

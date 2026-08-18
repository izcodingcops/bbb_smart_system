/**
 * Off Hours Visit — a submit-only audit report filed after walking a site
 * outside standard hours.
 *
 * There is deliberately no list or detail surface: submitted reports are read
 * back on the portal, not in the app. So these types serve one create form and
 * the store behind it, nothing else.
 */

/** How answering a question reveals its description box. */
export type OffHoursRevealRule = 'any' | 'yesNo';

export interface OffHoursQuestionOption {
  label: string;
  points: number;
}

export interface OffHoursQuestion {
  /** Stable key the form's answer/note/image maps are keyed by. */
  key: string;
  prompt: string;
  /** Italic sub-line, e.g. '(provide pictures)'. Empty when the question has none. */
  hint: string;
  options: OffHoursQuestionOption[];
  reveal: OffHoursRevealRule;
  /**
   * Short numeric labels ('1'…'4'), which render as the tight equal-width row
   * rather than wrapping pills — the design's `.optrow.num` variant.
   */
  numeric: boolean;
}

/**
 * One answered question, denormalized onto the record rather than indexed
 * positionally against the question list. A stored report has to stay readable
 * after the served question set changes.
 */
export interface OffHoursChecklistAnswer {
  /** The prompt as it read when the report was filed. */
  question: string;
  /** The chosen option's label. */
  answer: string;
  points: number;
  /** Empty when not given, or when the answer hides the description box. */
  note: string;
  images: string[];
}

export interface OffHoursVisit {
  /** Opaque store key, e.g. 'ohv_1187'. Never displayed. */
  id: string;
  /** Display reference, e.g. '#OHV-1187'. Never used for routing. */
  reference: string;
  /** Always 'Off Hour Visit' — the form locks it. */
  type: string;
  /** ISO-8601. */
  capturedAt: string;
  zone: string;
  /** Recomputed server-side from the answers; never taken from the client. */
  rating: number;
  ratingMax: number;
  auditNotes: string;
  checklist: OffHoursChecklistAnswer[];
  createdBy: string;
}

export interface OffHoursVisitFormOptions {
  /** Reserved when the form opens, e.g. '#OHV-1187'. */
  nextReference: string;
  /** The locked Type value, served so the lock isn't a client-side literal. */
  type: string;
  zones: string[];
  questions: OffHoursQuestion[];
}

export interface OffHoursVisitFormValues {
  /** ISO-8601. */
  capturedAt: string;
  zone: string;
  /** Question key → the chosen option's label. */
  answers: Record<string, string>;
  /** Question key → description text. */
  notes: Record<string, string>;
  /** Question key → local image URIs. */
  images: Record<string, string[]>;
  auditNotes: string;
}

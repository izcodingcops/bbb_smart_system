export type ObservationReportType = 'Ambassador' | 'Supervisor';

export interface ObservationReviewer {
  name: string;
}

export interface ObservationChecklistItem {
  question: string;
  answer: 'Yes' | 'No' | 'N/A';
  note: string;
}

export interface ObservationReport {
  /** Opaque server identifier. Never displayed — use `reference` for that. */
  id: string;
  /** Display reference, e.g. '#OBR-2043'. */
  reference: string;
  type: ObservationReportType;
  /** The Ambassador or Supervisor being observed. */
  name: string;
  /** ISO-8601 date, card display. */
  date: string;
  /** ISO-8601 datetime, detail's "Date/Time Captured". */
  dateTime: string;
  reviewedBy: ObservationReviewer;
  zone: string;
  /** Yes-count out of the fixed 5-question checklist. */
  score: number;
  summary: string;
  checklist: ObservationChecklistItem[];
  images: string[];
}

/* ------------------------------------------------------------------ *
 * The form
 * ------------------------------------------------------------------ */

/** One fixed checklist question, as the server's own question tree serves it. */
export interface ObservationQuestion {
  /** Stable key the form's answer map uses, e.g. 'q1'. */
  key: string;
  prompt: string;
}

export interface ObservationReportFormValues {
  type: ObservationReportType;
  /** The Ambassador or Supervisor being observed — '' until picked. */
  person: string;
  zone: string;
  /** ISO-8601. */
  dateTime: string;
  /** Question key → Yes/No. A key with no entry is unanswered. */
  answers: Record<string, 'Yes' | 'No'>;
  /** Question key → note text (a "why not" on No, the training topic on Q5's Yes). */
  notes: Record<string, string>;
  summary: string;
  images: string[];
}

export interface ObservationReportFormOptions {
  /** Reserved when the form opens, e.g. '#OBR-3054'. */
  nextReference: string;
  zones: string[];
  ambassadors: string[];
  supervisors: string[];
  questions: ObservationQuestion[];
}

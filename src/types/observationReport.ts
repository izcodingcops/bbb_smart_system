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
  /** 0–5, one decimal place. */
  score: number;
  summary: string;
  checklist: ObservationChecklistItem[];
}

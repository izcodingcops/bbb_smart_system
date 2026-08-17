/**
 * RVP Site Visit — a scored report an RVP files after walking a program with
 * its Operations Manager.
 *
 * Unlike Off Hours Visit, this module has a full surface: a list, a detail
 * view, an edit flow and a delete. So these types cover both the list row and
 * the answered record behind it.
 *
 * The question tree is *served*, and answers are *denormalized* onto the stored
 * record — a report carries the prompts it was answered against rather than
 * positional indexes into a shared constant, so an old report stays readable
 * after the served question set changes. Same rule as Observation Reports'
 * checklist.
 */

/* ------------------------------------------------------------------ *
 * The served question tree
 * ------------------------------------------------------------------ */

export interface RvpQuestion {
  /** Stable key the form's answer/note/image maps use, e.g. 'field.g0.q2'. */
  key: string;
  prompt: string;
}

export interface RvpQuestionGroup {
  /** Stable key, e.g. 'field.g0'. */
  key: string;
  title: string;
  /** Group asks for an observation window (start/end date & time). */
  requiresTime: boolean;
  /** Group asks the required 'How observed' note. */
  requiresHow: boolean;
  /** Label of the group's free-text box. Empty when it has none. */
  notesLabel: string;
  questions: RvpQuestion[];
}

export interface RvpSection {
  /** 'field' | 'hr' | 'org' | 'safe' | 'fin' | 'admin' | 'smart' | 'amb' | 'om' | 'cust' */
  key: string;
  title: string;
  /** The card's grey sub-line, e.g. 'Records, postings, training & recognition'. */
  subtitle: string;
  groups: RvpQuestionGroup[];
  /** Labels of the section-level free-text blocks below the groups. */
  textPrompts: string[];
}

/* ------------------------------------------------------------------ *
 * The stored record
 * ------------------------------------------------------------------ */

/** Yes scores 1, No scores 0. There is deliberately no N/A. */
export type RvpAnswerValue = 'Yes' | 'No';

export type RvpVisitType =
  | 'Full Site Visit'
  | 'Drop In Visit'
  | 'Special Purpose';

export interface RvpAnswer {
  /** The prompt as it read when the report was filed. */
  question: string;
  answer: RvpAnswerValue;
  /** Empty unless the answer was No — the server drops a note sent with a Yes. */
  note: string;
  images: string[];
}

export interface RvpAnsweredGroup {
  title: string;
  /** ISO-8601. Empty when the group asks for no observation window. */
  observedFrom: string;
  observedTo: string;
  /** Empty when the group doesn't ask for it. */
  howObserved: string;
  /** Empty when the group has no notes box. */
  notesLabel: string;
  notes: string;
  /**
   * Only the questions actually answered. A group short of its full set is
   * what makes a report incomplete — `isComplete` is derived from this, never
   * stored as a flag the answers could contradict.
   */
  answers: RvpAnswer[];
}

export interface RvpAnsweredSection {
  key: string;
  title: string;
  subtitle: string;
  groups: RvpAnsweredGroup[];
  texts: {label: string; value: string}[];
  /** Yes-count within this section. */
  score: number;
  /** Question count within this section — answered or not. */
  scoreMax: number;
}

/**
 * The list row. Deliberately carries no `sections`: at 74 answers a record,
 * shipping them with every row would make the list query enormous for data no
 * card displays.
 */
export interface RvpSiteVisit {
  /** Opaque store key, e.g. 'rvp_1188'. Never displayed. */
  id: string;
  /** Display reference, e.g. '#RVP-1188'. Never used for routing. */
  reference: string;
  program: string;
  operationManager: string;
  /** 'Regional Vice President' | 'Divisional Vice President' | 'Management' | 'System Administration' */
  leaderPosition: string;
  /** ISO-8601. */
  startDate: string;
  endDate: string;
  reviewedBy: string;
  updatedBy: string;
  /** ISO-8601. */
  updatedAt: string;
  /** Yes-count out of `scoreMax`. Scored server-side, never the client's total. */
  score: number;
  scoreMax: number;
  /**
   * `score / scoreMax × 5`, one decimal — the 0-5 scale the list card and the
   * Score filter buckets read. Derived, never stored independently.
   */
  avgScore: number;
  /** Every section saved and every question answered. */
  isComplete: boolean;
}

export interface RvpSiteVisitDetail extends RvpSiteVisit {
  visitType: RvpVisitType;
  /** Required for Drop In / Special Purpose; empty for a Full Site Visit. */
  reasonForVisit: string;
  images: string[];
  sections: RvpAnsweredSection[];
}

/* ------------------------------------------------------------------ *
 * The form
 * ------------------------------------------------------------------ */

/** One section's working state. Keyed throughout, never positional. */
export interface RvpSectionValues {
  /** Question key → Yes/No. A key with no entry is unanswered. */
  answers: Record<string, RvpAnswerValue>;
  /**
   * Question key → note text. Kept when the answer flips to Yes so that
   * No → Yes → No shows it again; the wire mapper is what drops it.
   */
  notes: Record<string, string>;
  /** Question key → local image URIs. */
  images: Record<string, string[]>;
  /** Group key → observation window, ISO-8601. */
  observed: Record<string, {from: string; to: string}>;
  /** Group key → 'How observed'. */
  howObserved: Record<string, string>;
  /** Group key → the group's own notes box. */
  groupNotes: Record<string, string>;
  /** Section text-prompt index → value. */
  texts: Record<number, string>;
  /** The user pressed Save Section at least once. */
  saved: boolean;
}

export interface RvpSiteVisitFormValues {
  program: string;
  /** '' until picked — the form won't submit without one. */
  visitType: RvpVisitType | '';
  /** ISO-8601. */
  startDate: string;
  endDate: string;
  operationManager: string;
  /** Required for Drop In / Special Purpose; dropped at the wire otherwise. */
  reasonForVisit: string;
  images: string[];
  /** Section key → that section's working state. */
  sections: Record<string, RvpSectionValues>;
}

export interface RvpSiteVisitFormOptions {
  /** Reserved when the form opens, e.g. '#RVP-1189'. */
  nextReference: string;
  programs: string[];
  visitTypes: RvpVisitType[];
  operationManagers: string[];
  sections: RvpSection[];
}

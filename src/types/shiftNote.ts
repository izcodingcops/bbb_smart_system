/**
 * Shift Notes — a submit-only briefing pushed to the team before a shift.
 *
 * Like Off Hours Visit there is deliberately no list or detail surface: shared
 * notes are read back on the portal, not in the app. So these types serve one
 * create form and the store behind it, nothing else.
 */

export type ShiftNotePriority = 'Low' | 'Medium' | 'High';

export interface ShiftNote {
  /** Opaque store key, e.g. 'shn_0441'. Never displayed. */
  id: string;
  /** Display reference, e.g. '#SHN-0441'. Never used for routing. */
  reference: string;
  shiftTypes: string[];
  /** ISO-8601. */
  sentAt: string;
  zone: string;
  /** True when the brief went to every ambassador in `zone`. */
  sendToAll: boolean;
  /**
   * The single recipient's name. Null whenever `sendToAll` — the resolver
   * clears it rather than trusting the client, so a stored note can never name
   * someone it wasn't sent to.
   */
  ambassador: string | null;
  priority: ShiftNotePriority;
  title: string;
  description: string;
  createdBy: string;
}

export interface ShiftNoteFormOptions {
  /** Reserved when the form opens, e.g. '#SHN-0442'. */
  nextReference: string;
  shiftTypes: string[];
  zones: string[];
  ambassadors: string[];
}

export interface ShiftNoteFormValues {
  shiftTypes: string[];
  /** ISO-8601. */
  sentAt: string;
  zone: string;
  sendToAll: boolean;
  /**
   * '' while `sendToAll`, or before one is picked. Kept rather than cleared
   * when the user flips back to "send to all", so flipping again shows the
   * previous pick — the mapper is what stops it reaching the store.
   */
  ambassador: string;
  priority: ShiftNotePriority;
  title: string;
  description: string;
}

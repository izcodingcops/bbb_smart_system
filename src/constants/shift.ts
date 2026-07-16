/**
 * Length of a standard shift. Owned here because both shift setup (which
 * derives the auto stop time) and home (which draws the progress bar against
 * it) must agree.
 */
export const SHIFT_HOURS = 8;

export const SHIFT_MS = SHIFT_HOURS * 60 * 60 * 1000;

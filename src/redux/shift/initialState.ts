import {ShiftState} from '../../types/shift';

/**
 * Kept out of slice.ts so redux-persist migrations can import it without
 * pulling in the slice's thunks — and through them the Apollo client and the
 * native location module.
 */
export const initialShiftState: ShiftState = {
  shiftTypeId: null,
  startTime: null,
  stopTime: null,
  autoEnd: true,
  isActive: false,
};

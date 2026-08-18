import {ShiftNoteFormValues} from '../../../types/shiftNote';

/**
 * Who this brief goes to, as a phrase that reads inside a sentence:
 * "…will be shared with **all ambassadors in RiverFront**".
 *
 * One function because two places have to agree on the wording — the confirm
 * dialog before sending and the success toast after — exactly as the mockup's
 * own `recipients()` is shared by both.
 */
export function recipientsLabel(values: ShiftNoteFormValues): string {
  if (values.sendToAll) {
    return `all ambassadors in ${values.zone || 'this zone'}`;
  }
  return values.ambassador || 'the selected ambassador';
}

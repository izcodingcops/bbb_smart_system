import {ShiftNote, ShiftNotePriority} from '../../../types/shiftNote';
import {MOCK_SHIFT_TYPES} from '../../../mocks/shiftTypes';
import {AMBASSADORS, PROGRAM_ZONES} from '../shared/options';
import {sleep} from '../../mockSession';
import {nextReference, shiftNoteStore} from './store';

/**
 * Explicit maps rather than case conversion, the same convention
 * observationReport's TYPE_OUT / TYPE_IN set. Local rather than imported from
 * maintenance or work: they translate the same shared `Priority` enum, but
 * reaching into another feature's private map to save four lines couples the
 * two for no gain.
 */
export const PRIORITY_OUT: Record<ShiftNotePriority, string> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
};

export const PRIORITY_IN: Record<string, ShiftNotePriority> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

const toWire = (record: ShiftNote) => ({
  ...record,
  priority: PRIORITY_OUT[record.priority],
});

interface NoteInput {
  shiftTypes: string[];
  sentAt: string;
  zone: string;
  sendToAll: boolean;
  ambassador?: string | null;
  priority: string;
  title: string;
  description: string;
}

export const shiftNoteResolvers = {
  Query: {
    shiftNoteFormOptions: async () => {
      await sleep();
      return {
        nextReference: nextReference(),
        // The program's own roster, not a list of this module's own — a shift
        // type means the same thing here as it does everywhere else.
        shiftTypes: MOCK_SHIFT_TYPES.map(type => type.name),
        zones: PROGRAM_ZONES,
        ambassadors: AMBASSADORS,
      };
    },
  },

  Mutation: {
    createShiftNote: async (_: unknown, args: {input: NoteInput}) => {
      await sleep();
      const {input} = args;
      const reference = nextReference();

      const record: ShiftNote = {
        id: `shn_${reference.replace('#SHN-', '')}`,
        reference,
        shiftTypes: input.shiftTypes,
        sentAt: input.sentAt,
        zone: input.zone,
        sendToAll: input.sendToAll,
        // Cleared rather than trusted: a note that went to the whole zone must
        // not be stored naming one ambassador, whatever the client sent.
        ambassador: input.sendToAll ? null : input.ambassador ?? null,
        priority: PRIORITY_IN[input.priority] ?? 'Low',
        title: input.title,
        description: input.description,
        createdBy: 'You',
      };

      shiftNoteStore.records.unshift(record);
      return toWire(record);
    },
  },
};

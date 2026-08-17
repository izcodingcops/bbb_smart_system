import {useMemo} from 'react';
import {useMutation, useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  ShiftNoteFormOptions,
  ShiftNoteFormValues,
} from '../../../types/shiftNote';
import {CREATE_SHIFT_NOTE, GET_SHIFT_NOTE_FORM_OPTIONS} from './documents';
import {PRIORITY_OUT} from './resolvers';

const SHIFT_NOTE_CONTEXT = {context: {feature: 'shiftNote'}};

interface GqlShiftNoteFormOptions {
  nextReference: string;
  shiftTypes: string[];
  zones: string[];
  ambassadors: string[];
}

const toOptions = (o: GqlShiftNoteFormOptions): ShiftNoteFormOptions => ({
  nextReference: o.nextReference,
  shiftTypes: o.shiftTypes,
  zones: o.zones,
  ambassadors: o.ambassadors,
});

/**
 * `network-only` because the payload carries `nextReference`. Cache-first, a
 * second note written in the same session opens with the header and confirm
 * dialog naming the reference the previous create already consumed.
 */
export function useShiftNoteFormOptionsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    shiftNoteFormOptions: GqlShiftNoteFormOptions;
  }>(GET_SHIFT_NOTE_FORM_OPTIONS, {
    ...SHIFT_NOTE_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
    fetchPolicy: 'network-only',
  });

  const options = useMemo(
    () =>
      data?.shiftNoteFormOptions ? toOptions(data.shiftNoteFormOptions) : null,
    [data],
  );

  return {data: options, isLoading: loading, isError: !!error, refetch};
}

/**
 * Not registered in the offline outbox, deliberately: with no in-app list a
 * queued note is invisible until it flushes, and a dead-lettered one would
 * silently discard the whole form. A failed send surfaces an error and keeps
 * the user's text for a retry instead.
 */
export function useCreateShiftNoteMutation() {
  const programId = GetActiveProgramId();
  const [run, {loading}] = useMutation<{
    createShiftNote: {
      id: string;
      reference: string;
      sendToAll: boolean;
      ambassador: string | null;
      zone: string;
    };
  }>(CREATE_SHIFT_NOTE, SHIFT_NOTE_CONTEXT);

  return {
    mutate: async (values: ShiftNoteFormValues) => {
      const result = await run({
        variables: {
          programId: programId ?? '',
          input: {
            shiftTypes: values.shiftTypes,
            sentAt: values.sentAt,
            zone: values.zone,
            sendToAll: values.sendToAll,
            // Hiding the ambassador field keeps the previous pick in form
            // state; this is what stops it reaching the store. The resolver
            // clears it too — neither side relies on the other.
            ambassador: values.sendToAll ? null : values.ambassador || null,
            priority: PRIORITY_OUT[values.priority],
            title: values.title,
            description: values.description,
          },
        },
      });
      const created = result.data?.createShiftNote;
      return {
        id: created?.id ?? '',
        reference: created?.reference ?? '',
        sendToAll: created?.sendToAll ?? true,
        // Nullable in the SDL: the mock always sends a value or an explicit
        // null, a real gateway may leave the field out entirely.
        ambassador: created?.ambassador ?? null,
        zone: created?.zone ?? '',
      };
    },
    isLoading: loading,
  };
}

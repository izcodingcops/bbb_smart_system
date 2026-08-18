import {useMemo} from 'react';
import {useMutation, useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  OffHoursQuestion,
  OffHoursVisitFormOptions,
  OffHoursVisitFormValues,
} from '../../../types/offHoursVisit';
import {
  CREATE_OFF_HOURS_VISIT,
  GET_OFF_HOURS_VISIT_FORM_OPTIONS,
} from './documents';
import {REVEAL_IN} from './resolvers';

const OFF_HOURS_CONTEXT = {context: {feature: 'offHoursVisit'}};

interface GqlOffHoursQuestion {
  key: string;
  prompt: string;
  hint: string;
  options: {label: string; points: number}[];
  reveal: string;
  numeric: boolean;
}

interface GqlOffHoursVisitFormOptions {
  nextReference: string;
  type: string;
  zones: string[];
  questions: GqlOffHoursQuestion[];
}

const toQuestion = (q: GqlOffHoursQuestion): OffHoursQuestion => ({
  key: q.key,
  prompt: q.prompt,
  hint: q.hint,
  options: q.options,
  reveal: REVEAL_IN[q.reveal] ?? 'any',
  numeric: q.numeric,
});

const toOptions = (
  o: GqlOffHoursVisitFormOptions,
): OffHoursVisitFormOptions => ({
  nextReference: o.nextReference,
  type: o.type,
  zones: o.zones,
  questions: o.questions.map(toQuestion),
});

/**
 * `network-only` because the payload carries `nextReference`. Cache-first, a
 * second visit filed in the same session opens with the header and confirm
 * dialog naming the reference the previous create already consumed.
 */
export function useOffHoursVisitFormOptionsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    offHoursVisitFormOptions: GqlOffHoursVisitFormOptions;
  }>(GET_OFF_HOURS_VISIT_FORM_OPTIONS, {
    ...OFF_HOURS_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
    fetchPolicy: 'network-only',
  });

  const options = useMemo(
    () =>
      data?.offHoursVisitFormOptions
        ? toOptions(data.offHoursVisitFormOptions)
        : null,
    [data],
  );

  return {data: options, isLoading: loading, isError: !!error, refetch};
}

/**
 * Whether a question's description box is showing, given the current answer:
 * `any` reveals it on any option, `yesNo` only on a No.
 *
 * Exported because two places have to agree on it — the form decides whether
 * to render the box, and the mapper below decides whether to send what's in
 * it. Hiding the box deliberately leaves the typed text in form state, so
 * flipping No → Yes → No shows it again rather than blanking it; dropping it
 * here is what stops a hidden note reaching the store.
 */
export function isNoteVisible(
  question: OffHoursQuestion,
  answer: string,
): boolean {
  if (!answer) {
    return false;
  }
  return question.reveal === 'any' || answer === 'No';
}

/**
 * Maps the form's per-question maps into the wire's answer list. Questions the
 * user hasn't answered are left out entirely; the form won't submit until all
 * of them are.
 */
function toWireAnswers(
  values: OffHoursVisitFormValues,
  questions: OffHoursQuestion[],
) {
  return questions.flatMap(question => {
    const answer = values.answers[question.key] ?? '';
    if (!answer) {
      return [];
    }
    return [
      {
        key: question.key,
        answer,
        note: isNoteVisible(question, answer)
          ? values.notes[question.key] ?? ''
          : '',
        images: values.images[question.key] ?? [],
      },
    ];
  });
}

/**
 * Not registered in the offline outbox, deliberately: with no in-app list a
 * queued report is invisible until it flushes, and a dead-lettered one would
 * silently discard the whole form. A failed submit surfaces an error and keeps
 * the user's answers for a retry instead.
 */
export function useCreateOffHoursVisitMutation() {
  const programId = GetActiveProgramId();
  const [run, {loading}] = useMutation<{
    createOffHoursVisit: {
      id: string;
      reference: string;
      rating: number;
      ratingMax: number;
    };
  }>(CREATE_OFF_HOURS_VISIT, OFF_HOURS_CONTEXT);

  return {
    mutate: async (
      values: OffHoursVisitFormValues,
      questions: OffHoursQuestion[],
    ) => {
      const result = await run({
        variables: {
          programId: programId ?? '',
          input: {
            capturedAt: values.capturedAt,
            zone: values.zone,
            auditNotes: values.auditNotes,
            answers: toWireAnswers(values, questions),
          },
        },
      });
      return {
        id: result.data?.createOffHoursVisit.id ?? '',
        reference: result.data?.createOffHoursVisit.reference ?? '',
        rating: result.data?.createOffHoursVisit.rating ?? 0,
        ratingMax: result.data?.createOffHoursVisit.ratingMax ?? 0,
      };
    },
    isLoading: loading,
  };
}

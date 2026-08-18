import {useMemo} from 'react';
import {useMutation, useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  RvpSection,
  RvpSiteVisit,
  RvpSiteVisitDetail,
  RvpSiteVisitFormOptions,
  RvpSiteVisitFormValues,
  RvpVisitType,
} from '../../../types/rvpSiteVisit';
import {
  CREATE_RVP_SITE_VISIT,
  DELETE_RVP_SITE_VISIT,
  GET_RVP_SITE_VISIT,
  GET_RVP_SITE_VISIT_FORM_OPTIONS,
  GET_RVP_SITE_VISITS,
  UPDATE_RVP_SITE_VISIT,
} from './documents';
import {ANSWER_IN, ANSWER_OUT, VISIT_TYPE_IN, VISIT_TYPE_OUT} from './resolvers';

const RVP_CONTEXT = {context: {feature: 'rvpSiteVisit'}};

interface GqlRvpSiteVisit {
  id: string;
  reference: string;
  program: string;
  operationManager: string;
  leaderPosition: string;
  startDate: string;
  endDate: string;
  reviewedBy: string;
  updatedBy: string;
  updatedAt: string;
  score: number;
  scoreMax: number;
  avgScore: number;
  isComplete: boolean;
}

interface GqlRvpAnswer {
  question: string;
  answer: string;
  note: string;
  images: string[];
}

interface GqlRvpGroup {
  title: string;
  observedFrom: string;
  observedTo: string;
  howObserved: string;
  notesLabel: string;
  notes: string;
  answers: GqlRvpAnswer[];
}

interface GqlRvpSection {
  key: string;
  title: string;
  subtitle: string;
  score: number;
  scoreMax: number;
  texts: {label: string; value: string}[];
  groups: GqlRvpGroup[];
}

interface GqlRvpSiteVisitDetail extends GqlRvpSiteVisit {
  visitType: string;
  reasonForVisit: string;
  images: string[];
  sections: GqlRvpSection[];
}

const toSummary = (r: GqlRvpSiteVisit): RvpSiteVisit => ({...r});

/*
 * Mirrors the resolver's own recursion — `answer` sits three levels down, so
 * mapping only the top level would leave 'YES' where the app expects 'Yes'.
 */
const toDetail = (r: GqlRvpSiteVisitDetail): RvpSiteVisitDetail => ({
  ...toSummary(r),
  visitType: VISIT_TYPE_IN[r.visitType] ?? 'Full Site Visit',
  reasonForVisit: r.reasonForVisit,
  images: r.images,
  sections: r.sections.map(section => ({
    key: section.key,
    title: section.title,
    subtitle: section.subtitle,
    score: section.score,
    scoreMax: section.scoreMax,
    texts: section.texts,
    groups: section.groups.map(group => ({
      title: group.title,
      observedFrom: group.observedFrom,
      observedTo: group.observedTo,
      howObserved: group.howObserved,
      notesLabel: group.notesLabel,
      notes: group.notes,
      answers: group.answers.map(answer => ({
        question: answer.question,
        answer: ANSWER_IN[answer.answer] ?? 'No',
        note: answer.note,
        images: answer.images,
      })),
    })),
  })),
});

/**
 * The mapped array is memoized because `RvpSiteVisitCard` is `React.memo`'d —
 * a fresh array identity on every render would make that memo inert.
 */
export function useGetRvpSiteVisitsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    rvpSiteVisits: GqlRvpSiteVisit[];
  }>(GET_RVP_SITE_VISITS, {
    ...RVP_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
  });

  const visits = useMemo(
    () => (data?.rvpSiteVisits ?? []).map(toSummary),
    [data],
  );

  return {data: visits, isLoading: loading, isError: !!error, refetch};
}

export function useGetRvpSiteVisitQuery(id: string) {
  const {data, loading, error, refetch} = useQuery<{
    rvpSiteVisit: GqlRvpSiteVisitDetail | null;
  }>(GET_RVP_SITE_VISIT, {...RVP_CONTEXT, variables: {id}});

  const visit = useMemo(
    () => (data?.rvpSiteVisit ? toDetail(data.rvpSiteVisit) : null),
    [data],
  );

  return {data: visit, isLoading: loading, isError: !!error, refetch};
}

/* ------------------------------------------------------------------ *
 * The form
 * ------------------------------------------------------------------ */

interface GqlRvpFormOptions {
  nextReference: string;
  programs: string[];
  visitTypes: string[];
  operationManagers: string[];
  sections: RvpSection[];
}

/**
 * `network-only` because the payload carries `nextReference`. Cache-first, a
 * second report filed in the same session would open with the header and
 * confirm dialog naming the reference the previous create already consumed.
 */
export function useRvpSiteVisitFormOptionsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    rvpSiteVisitFormOptions: GqlRvpFormOptions;
  }>(GET_RVP_SITE_VISIT_FORM_OPTIONS, {
    ...RVP_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
    fetchPolicy: 'network-only',
  });

  const options = useMemo<RvpSiteVisitFormOptions | null>(() => {
    const served = data?.rvpSiteVisitFormOptions;
    if (!served) {
      return null;
    }
    return {
      nextReference: served.nextReference,
      programs: served.programs,
      visitTypes: served.visitTypes.flatMap(t =>
        VISIT_TYPE_IN[t] ? [VISIT_TYPE_IN[t]] : [],
      ),
      operationManagers: served.operationManagers,
      // No enum lives inside the tree, so it maps straight across.
      sections: served.sections,
    };
  }, [data]);

  return {data: options, isLoading: loading, isError: !!error, refetch};
}

/**
 * Maps form state onto the wire input.
 *
 * Two things are dropped here as well as server-side, so neither half relies on
 * the other: a note attached to a Yes, and a reason on a Full Site Visit. Both
 * stay in form state — hiding a field never clears it, so flipping back shows
 * the previous text again.
 *
 * Only answered questions are sent. An unanswered one is absent rather than
 * blank, which is what leaves the stored report incomplete.
 */
export function toWireInput(
  values: RvpSiteVisitFormValues,
  sections: RvpSection[],
) {
  const isFullVisit = values.visitType === 'Full Site Visit';

  return {
    program: values.program,
    visitType: VISIT_TYPE_OUT[values.visitType as RvpVisitType],
    reasonForVisit: isFullVisit ? '' : values.reasonForVisit,
    operationManager: values.operationManager,
    startDate: values.startDate,
    endDate: values.endDate,
    images: values.images,
    sections: sections.map(section => {
      const state = values.sections[section.key];
      return {
        key: section.key,
        texts: section.textPrompts.map((_, i) => state?.texts[i] ?? ''),
        groups: section.groups.map(group => {
          const observed = state?.observed[group.key];
          return {
            key: group.key,
            observedFrom: group.requiresTime ? observed?.from ?? '' : '',
            observedTo: group.requiresTime ? observed?.to ?? '' : '',
            howObserved: group.requiresHow
              ? state?.howObserved[group.key] ?? ''
              : '',
            notes: group.notesLabel ? state?.groupNotes[group.key] ?? '' : '',
            answers: group.questions.flatMap(question => {
              const answer = state?.answers[question.key];
              if (!answer) {
                return [];
              }
              return [
                {
                  key: question.key,
                  answer: ANSWER_OUT[answer],
                  note: answer === 'No' ? state?.notes[question.key] ?? '' : '',
                  images: state?.images[question.key] ?? [],
                },
              ];
            }),
          };
        }),
      };
    }),
  };
}

/**
 * Not registered in the offline outbox, deliberately: a 74-question payload
 * doesn't fit the registry's thin optimistic shell, and a dead-lettered report
 * would silently discard an afternoon of fieldwork. A failed submit surfaces an
 * error and keeps every answer for a retry instead.
 */
export function useCreateRvpSiteVisitMutation() {
  const programId = GetActiveProgramId();
  const [run, {loading}] = useMutation<{
    createRvpSiteVisit: GqlRvpSiteVisitDetail;
  }>(CREATE_RVP_SITE_VISIT, {
    ...RVP_CONTEXT,
    refetchQueries: ['GetRvpSiteVisits'],
  });

  return {
    mutate: async (
      values: RvpSiteVisitFormValues,
      sections: RvpSection[],
    ): Promise<{id: string; reference: string; score: number}> => {
      const result = await run({
        variables: {
          programId: programId ?? '',
          input: toWireInput(values, sections),
        },
      });
      const created = result.data?.createRvpSiteVisit;
      return {
        id: created?.id ?? '',
        reference: created?.reference ?? '',
        score: created?.score ?? 0,
      };
    },
    isLoading: loading,
  };
}

export function useUpdateRvpSiteVisitMutation() {
  const [run, {loading}] = useMutation<{
    updateRvpSiteVisit: GqlRvpSiteVisitDetail;
  }>(UPDATE_RVP_SITE_VISIT, {
    ...RVP_CONTEXT,
    // GetRvpSiteVisit as well, or the detail behind the closing edit overlay
    // still shows pre-edit values.
    refetchQueries: ['GetRvpSiteVisits', 'GetRvpSiteVisit'],
  });

  return {
    mutate: async (
      id: string,
      values: RvpSiteVisitFormValues,
      sections: RvpSection[],
    ) => {
      await run({variables: {id, input: toWireInput(values, sections)}});
    },
    isLoading: loading,
  };
}

export function useDeleteRvpSiteVisitMutation() {
  const [run, {loading}] = useMutation<{deleteRvpSiteVisit: string}>(
    DELETE_RVP_SITE_VISIT,
    {...RVP_CONTEXT, refetchQueries: ['GetRvpSiteVisits']},
  );

  return {
    mutate: async (id: string) => {
      await run({variables: {id}});
    },
    isLoading: loading,
  };
}

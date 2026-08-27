import {useMemo} from 'react';
import {useMutation, useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  ObservationReport,
  ObservationReportFormOptions,
  ObservationReportFormValues,
  ObservationReportType,
} from '../../../types/observationReport';
import {
  CREATE_OBSERVATION_REPORT,
  DELETE_OBSERVATION_REPORT,
  GET_OBSERVATION_REPORT,
  GET_OBSERVATION_REPORT_FORM_OPTIONS,
  GET_OBSERVATION_REPORTS,
  UPDATE_OBSERVATION_REPORT,
} from './documents';

interface GqlObservationReport {
  id: string;
  reference: string;
  type: 'AMBASSADOR' | 'SUPERVISOR';
  name: string;
  date: string;
  dateTime: string;
  reviewedBy: {name: string};
  zone: string;
  score: number;
  summary: string;
  checklist: {question: string; answer: string; note: string | null}[];
  images: string[];
}

const TYPE_IN: Record<GqlObservationReport['type'], ObservationReportType> = {
  AMBASSADOR: 'Ambassador',
  SUPERVISOR: 'Supervisor',
};

const toReport = (r: GqlObservationReport): ObservationReport => ({
  id: r.id,
  reference: r.reference,
  type: TYPE_IN[r.type],
  name: r.name,
  date: r.date,
  dateTime: r.dateTime,
  reviewedBy: r.reviewedBy,
  zone: r.zone,
  score: r.score,
  summary: r.summary,
  checklist: r.checklist.map(c => ({
    question: c.question,
    answer: c.answer as ObservationReport['checklist'][number]['answer'],
    note: c.note ?? '',
  })),
  images: r.images,
});

const OBSERVATION_REPORT_CONTEXT = {context: {feature: 'observationReport'}};

export function useGetObservationReportsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{observationReports: GqlObservationReport[]}>(
    GET_OBSERVATION_REPORTS,
    {
      ...OBSERVATION_REPORT_CONTEXT,
      variables: {programId: programId ?? ''},
      skip: !programId,
    },
  );

  const reports = useMemo(
    () => (data?.observationReports ?? []).map(toReport),
    [data],
  );

  return {data: reports, isLoading: loading, isError: !!error, refetch};
}

export function useGetObservationReportQuery(id: string) {
  const {data, loading, error, refetch} = useQuery<{observationReport: GqlObservationReport | null}>(
    GET_OBSERVATION_REPORT,
    {...OBSERVATION_REPORT_CONTEXT, variables: {id}},
  );

  const report = useMemo(
    () => (data?.observationReport ? toReport(data.observationReport) : null),
    [data],
  );

  return {data: report, isLoading: loading, isError: !!error, refetch};
}

/* ------------------------------------------------------------------ *
 * The form
 * ------------------------------------------------------------------ */

/**
 * `network-only` is the default because the payload carries `nextReference` —
 * cache-first, a second report filed in the same session would reuse the
 * reference the previous create already consumed. Same convention as RVP's
 * own form-options query. The list filter sheet passes 'cache-first'
 * explicitly: it only reads Zone, which doesn't need per-open freshness.
 */
export function useObservationReportFormOptionsQuery(
  fetchPolicy: 'network-only' | 'cache-first' = 'network-only',
) {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    observationReportFormOptions: ObservationReportFormOptions;
  }>(GET_OBSERVATION_REPORT_FORM_OPTIONS, {
    ...OBSERVATION_REPORT_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
    fetchPolicy,
  });

  return {
    data: data?.observationReportFormOptions ?? null,
    isLoading: loading,
    isError: !!error,
    refetch,
  };
}

/**
 * Maps form state onto the wire input. Only answered questions are sent — an
 * unanswered one is simply absent, which is what `buildChecklist` on the
 * server falls back to 'No' for. The form itself gates submit on every
 * question being answered, so this only matters for a stale in-flight
 * request against options that have since changed.
 */
function toWireInput(values: ObservationReportFormValues) {
  return {
    type: values.type === 'Supervisor' ? 'SUPERVISOR' : 'AMBASSADOR',
    name: values.person,
    zone: values.zone,
    dateTime: values.dateTime,
    answers: Object.entries(values.answers).map(([key, answer]) => ({
      key,
      answer: answer === 'No' ? 'No' : 'Yes',
      note: values.notes[key] || null,
    })),
    summary: values.summary || null,
    images: values.images,
  };
}

interface GqlObservationReportSummary {
  id: string;
  reference: string;
  score: number;
}

/**
 * Not registered in the offline outbox, deliberately: opening the form needs
 * a live `nextReference` and picklists the same way RVP's does, so there is
 * no meaningful offline path to queue a create onto in the first place.
 */
export function useCreateObservationReportMutation() {
  const programId = GetActiveProgramId();
  const [run, {loading}] = useMutation<{
    createObservationReport: GqlObservationReportSummary;
  }>(CREATE_OBSERVATION_REPORT, {
    ...OBSERVATION_REPORT_CONTEXT,
    refetchQueries: ['GetObservationReports'],
  });

  return {
    mutate: async (
      values: ObservationReportFormValues,
    ): Promise<{id: string; reference: string; score: number}> => {
      const result = await run({
        variables: {programId: programId ?? '', input: toWireInput(values)},
      });
      const created = result.data?.createObservationReport;
      return {
        id: created?.id ?? '',
        reference: created?.reference ?? '',
        score: created?.score ?? 0,
      };
    },
    isLoading: loading,
  };
}

export function useUpdateObservationReportMutation() {
  const [run, {loading}] = useMutation<{
    updateObservationReport: GqlObservationReportSummary;
  }>(UPDATE_OBSERVATION_REPORT, {
    ...OBSERVATION_REPORT_CONTEXT,
    // GetObservationReport as well, or the detail behind the closing edit
    // form still shows pre-edit values.
    refetchQueries: ['GetObservationReports', 'GetObservationReport'],
  });

  return {
    mutate: async (id: string, values: ObservationReportFormValues) => {
      await run({variables: {id, input: toWireInput(values)}});
    },
    isLoading: loading,
  };
}

export function useDeleteObservationReportMutation() {
  const [run, {loading}] = useMutation<{deleteObservationReport: string}>(
    DELETE_OBSERVATION_REPORT,
    {...OBSERVATION_REPORT_CONTEXT, refetchQueries: ['GetObservationReports']},
  );

  return {
    mutate: async (id: string) => {
      await run({variables: {id}});
    },
    isLoading: loading,
  };
}

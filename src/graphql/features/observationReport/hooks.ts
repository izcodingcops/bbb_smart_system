import {useMemo} from 'react';
import {useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {ObservationReport, ObservationReportType} from '../../../types/observationReport';
import {GET_OBSERVATION_REPORT, GET_OBSERVATION_REPORTS} from './documents';

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

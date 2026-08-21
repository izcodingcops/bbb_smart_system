import {useMemo} from 'react';
import {useQuery} from '@apollo/client/react';
import {Ambassador, AmbassadorStatus, AmbassadorWork} from '../../../types/ambassador';
import {ObservationReport, ObservationReportType} from '../../../types/observationReport';
import {
  GET_AMBASSADOR,
  GET_AMBASSADOR_REPORTS,
  GET_AMBASSADOR_WORK,
  GET_AMBASSADOR_WORK_ITEM,
  GET_AMBASSADORS,
} from './documents';

interface GqlAmbassador {
  id: string;
  reference: string;
  name: string;
  username: string;
  jobTitle: string;
  status: 'ACTIVE' | 'IN_ACTIVE' | 'SUSPENDED';
  points: number;
  cases: number;
  rating: number;
  lastLoggedIn: string;
  badges: string[];
  totalWork: number;
  totalReports: number;
}

const STATUS_IN: Record<GqlAmbassador['status'], AmbassadorStatus> = {
  ACTIVE: 'Active',
  IN_ACTIVE: 'In-active',
  SUSPENDED: 'Suspended',
};

const toAmbassador = (a: GqlAmbassador): Ambassador => ({
  id: a.id,
  reference: a.reference,
  name: a.name,
  username: a.username,
  jobTitle: a.jobTitle,
  status: STATUS_IN[a.status],
  points: a.points,
  cases: a.cases,
  rating: a.rating,
  lastLoggedIn: a.lastLoggedIn,
  badges: a.badges,
  totalWork: a.totalWork,
  totalReports: a.totalReports,
});

interface GqlAmbassadorWork {
  id: string;
  reference: string;
  ambassadorId: string;
  type: 'CLEANING' | 'MAINTENANCE';
  subType: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'OPEN';
  points: number;
  date: string;
  businessName: string;
  quantity: string;
  zone: string;
  address: string;
  describeLocation: string;
  fixtureType: string | null;
  fixture: string | null;
  service: string;
}

const WORK_TYPE_IN: Record<GqlAmbassadorWork['type'], AmbassadorWork['type']> = {
  CLEANING: 'Cleaning',
  MAINTENANCE: 'Maintenance',
};

const WORK_STATUS_IN: Record<GqlAmbassadorWork['status'], AmbassadorWork['status']> = {
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In Progress',
  OPEN: 'Open',
};

const toAmbassadorWork = (w: GqlAmbassadorWork): AmbassadorWork => ({
  id: w.id,
  reference: w.reference,
  ambassadorId: w.ambassadorId,
  type: WORK_TYPE_IN[w.type],
  subType: w.subType,
  status: WORK_STATUS_IN[w.status],
  points: w.points,
  date: w.date,
  businessName: w.businessName,
  quantity: w.quantity,
  zone: w.zone,
  address: w.address,
  describeLocation: w.describeLocation,
  fixtureType: w.fixtureType,
  fixture: w.fixture,
  service: w.service,
});

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

/** Same mapping as observationReport/hooks.ts — this module reuses the type verbatim. */
const REPORT_TYPE_IN: Record<GqlObservationReport['type'], ObservationReportType> = {
  AMBASSADOR: 'Ambassador',
  SUPERVISOR: 'Supervisor',
};

const toReport = (r: GqlObservationReport): ObservationReport => ({
  id: r.id,
  reference: r.reference,
  type: REPORT_TYPE_IN[r.type],
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

const AMBASSADOR_CONTEXT = {context: {feature: 'ambassador'}};

export function useGetAmbassadorsQuery() {
  const {data, loading, error, refetch} = useQuery<{ambassadors: GqlAmbassador[]}>(
    GET_AMBASSADORS,
    AMBASSADOR_CONTEXT,
  );

  const ambassadors = useMemo(
    () => (data?.ambassadors ?? []).map(toAmbassador),
    [data],
  );

  return {data: ambassadors, isLoading: loading, isError: !!error, refetch};
}

export function useGetAmbassadorQuery(id: string) {
  const {data, loading, error, refetch} = useQuery<{ambassador: GqlAmbassador | null}>(
    GET_AMBASSADOR,
    {...AMBASSADOR_CONTEXT, variables: {id}, skip: !id},
  );

  const ambassador = useMemo(
    () => (data?.ambassador ? toAmbassador(data.ambassador) : null),
    [data],
  );

  return {data: ambassador, isLoading: loading, isError: !!error, refetch};
}

export function useGetAmbassadorWorkQuery(ambassadorId: string) {
  const {data, loading, error, refetch} = useQuery<{ambassadorWork: GqlAmbassadorWork[]}>(
    GET_AMBASSADOR_WORK,
    {...AMBASSADOR_CONTEXT, variables: {ambassadorId}},
  );

  const work = useMemo(
    () => (data?.ambassadorWork ?? []).map(toAmbassadorWork),
    [data],
  );

  return {data: work, isLoading: loading, isError: !!error, refetch};
}

export function useGetAmbassadorWorkItemQuery(id: string) {
  const {data, loading, error, refetch} = useQuery<{
    ambassadorWorkItem: GqlAmbassadorWork | null;
  }>(GET_AMBASSADOR_WORK_ITEM, {...AMBASSADOR_CONTEXT, variables: {id}});

  const item = useMemo(
    () => (data?.ambassadorWorkItem ? toAmbassadorWork(data.ambassadorWorkItem) : null),
    [data],
  );

  return {data: item, isLoading: loading, isError: !!error, refetch};
}

export function useGetAmbassadorReportsQuery(ambassadorId: string) {
  const {data, loading, error, refetch} = useQuery<{
    ambassadorReports: GqlObservationReport[];
  }>(GET_AMBASSADOR_REPORTS, {...AMBASSADOR_CONTEXT, variables: {ambassadorId}});

  const reports = useMemo(
    () => (data?.ambassadorReports ?? []).map(toReport),
    [data],
  );

  return {data: reports, isLoading: loading, isError: !!error, refetch};
}

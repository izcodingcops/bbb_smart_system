import {useMemo} from 'react';
import {useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  RvpSiteVisit,
  RvpSiteVisitDetail,
} from '../../../types/rvpSiteVisit';
import {GET_RVP_SITE_VISIT, GET_RVP_SITE_VISITS} from './documents';
import {ANSWER_IN, VISIT_TYPE_IN} from './resolvers';

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

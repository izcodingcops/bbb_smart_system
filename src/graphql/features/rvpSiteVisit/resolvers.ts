import {
  RvpAnswer,
  RvpAnsweredGroup,
  RvpAnsweredSection,
  RvpAnswerValue,
  RvpSiteVisit,
  RvpSiteVisitDetail,
  RvpVisitType,
} from '../../../types/rvpSiteVisit';
import {sleep} from '../../mockSession';
import {findRecord, rvpSiteVisitStore} from './store';

/**
 * Explicit maps rather than `.toUpperCase()`: 'Full Site Visit' uppercases to
 * 'FULL SITE VISIT', not the SDL's 'FULL_SITE_VISIT'. Same convention as
 * observationReport's TYPE_OUT / TYPE_IN.
 */
export const ANSWER_OUT: Record<RvpAnswerValue, string> = {
  Yes: 'YES',
  No: 'NO',
};

export const ANSWER_IN: Record<string, RvpAnswerValue> = {
  YES: 'Yes',
  NO: 'No',
};

export const VISIT_TYPE_OUT: Record<RvpVisitType, string> = {
  'Full Site Visit': 'FULL_SITE_VISIT',
  'Drop In Visit': 'DROP_IN_VISIT',
  'Special Purpose': 'SPECIAL_PURPOSE',
};

export const VISIT_TYPE_IN: Record<string, RvpVisitType> = {
  FULL_SITE_VISIT: 'Full Site Visit',
  DROP_IN_VISIT: 'Drop In Visit',
  SPECIAL_PURPOSE: 'Special Purpose',
};

/** Yes-count across every answered question. */
function scoreOf(sections: RvpAnsweredSection[]): number {
  return sections.reduce(
    (total, section) =>
      total +
      section.groups.reduce(
        (n, group) => n + group.answers.filter(a => a.answer === 'Yes').length,
        0,
      ),
    0,
  );
}

/** Every question in the tree, answered or not. */
function scoreMaxOf(sections: RvpAnsweredSection[]): number {
  return sections.reduce((total, section) => total + section.scoreMax, 0);
}

/** The 0-5 scale the list card and the Score filter buckets read. */
function avgScoreOf(score: number, scoreMax: number): number {
  if (scoreMax === 0) {
    return 0;
  }
  return Math.round((score / scoreMax) * 5 * 10) / 10;
}

/**
 * A report is complete when every question in the tree has an answer — derived
 * from the answers themselves, never read off a stored flag that the answers
 * could contradict.
 */
function isCompleteOf(sections: RvpAnsweredSection[]): boolean {
  return sections.every(section => {
    const answered = section.groups.reduce(
      (n, group) => n + group.answers.length,
      0,
    );
    return answered === section.scoreMax;
  });
}

/**
 * The list shape: everything but `sections` and the fields only the detail
 * shows. Scores are recomputed here rather than trusted from the record, so
 * the list and the detail can never disagree about a report's score.
 */
export function toWireSummary(record: RvpSiteVisitDetail) {
  const score = scoreOf(record.sections);
  const scoreMax = scoreMaxOf(record.sections);
  const summary: RvpSiteVisit = {
    id: record.id,
    reference: record.reference,
    program: record.program,
    operationManager: record.operationManager,
    leaderPosition: record.leaderPosition,
    startDate: record.startDate,
    endDate: record.endDate,
    reviewedBy: record.reviewedBy,
    updatedBy: record.updatedBy,
    updatedAt: record.updatedAt,
    score,
    scoreMax,
    avgScore: avgScoreOf(score, scoreMax),
    isComplete: isCompleteOf(record.sections),
  };
  return summary;
}

/*
 * The enum lives three levels down — section → group → answer — so this has to
 * recurse. A top-level-only mapper type-checks perfectly well and then serves
 * 'Yes' where the SDL promised YES, which graphql rejects at execution time.
 */
const toWireAnswer = (answer: RvpAnswer) => ({
  ...answer,
  answer: ANSWER_OUT[answer.answer],
});

const toWireGroup = (group: RvpAnsweredGroup) => ({
  ...group,
  answers: group.answers.map(toWireAnswer),
});

const toWireSection = (section: RvpAnsweredSection) => ({
  ...section,
  groups: section.groups.map(toWireGroup),
});

export function toWireDetail(record: RvpSiteVisitDetail) {
  return {
    ...toWireSummary(record),
    visitType: VISIT_TYPE_OUT[record.visitType],
    reasonForVisit: record.reasonForVisit,
    images: record.images,
    sections: record.sections.map(toWireSection),
  };
}

export const rvpSiteVisitResolvers = {
  Query: {
    // No filter argument: the screen filters, sorts and searches client-side,
    // same convention as observation reports and fixtures.
    rvpSiteVisits: async () => {
      await sleep();
      return [...rvpSiteVisitStore.records]
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .map(toWireSummary);
    },

    rvpSiteVisit: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findRecord(args.id);
      return record ? toWireDetail(record) : null;
    },
  },
};

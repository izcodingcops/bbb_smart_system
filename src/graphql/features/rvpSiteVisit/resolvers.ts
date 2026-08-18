import {
  RvpAnswer,
  RvpAnsweredGroup,
  RvpAnsweredSection,
  RvpAnswerValue,
  RvpSiteVisit,
  RvpSiteVisitDetail,
  RvpVisitType,
} from '../../../types/rvpSiteVisit';
import {
  RVP_PROGRAMS,
  RVP_OPERATION_MANAGERS,
  RVP_SECTIONS,
  rvpLeaderPositionFor,
} from '../../../mocks/rvpSiteVisit';
import {sleep} from '../../mockSession';
import {findRecord, nextReference, rvpSiteVisitStore} from './store';

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

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

interface AnswerInput {
  key: string;
  answer: string;
  note?: string | null;
  images?: string[] | null;
}

interface GroupInput {
  key: string;
  observedFrom?: string | null;
  observedTo?: string | null;
  howObserved?: string | null;
  notes?: string | null;
  answers: AnswerInput[];
}

interface SectionInput {
  key: string;
  groups: GroupInput[];
  texts: string[];
}

interface VisitInput {
  program: string;
  visitType: string;
  reasonForVisit?: string | null;
  operationManager: string;
  startDate: string;
  endDate: string;
  images?: string[] | null;
  sections: SectionInput[];
}

/**
 * Rebuilds the stored answer tree from a submission.
 *
 * Walks the **server's** question tree rather than the input, which is what
 * enforces every rule at once: answers are stored in tree order rather than
 * submission order, a key that doesn't resolve is dropped instead of becoming a
 * phantom entry, and a question nobody answered is simply absent — which is
 * what later makes `isComplete` false.
 *
 * A note is dropped from a Yes here regardless of what the client sent. The
 * form drops it too; neither side relies on the other.
 */
function buildAnsweredSections(input: VisitInput): RvpAnsweredSection[] {
  const sectionsByKey = new Map(input.sections.map(s => [s.key, s]));

  return RVP_SECTIONS.map(section => {
    const submittedSection = sectionsByKey.get(section.key);
    const groupsByKey = new Map(
      (submittedSection?.groups ?? []).map(g => [g.key, g]),
    );
    let score = 0;
    let scoreMax = 0;

    const groups: RvpAnsweredGroup[] = section.groups.map(group => {
      const submitted = groupsByKey.get(group.key);
      const answersByKey = new Map(
        (submitted?.answers ?? []).map(a => [a.key, a]),
      );

      const answers: RvpAnswer[] = group.questions.flatMap(question => {
        scoreMax++;
        const given = answersByKey.get(question.key);
        const answer = given ? ANSWER_IN[given.answer] : undefined;
        if (!answer) {
          return [];
        }
        if (answer === 'Yes') {
          score++;
        }
        return [
          {
            question: question.prompt,
            answer,
            note: answer === 'No' ? given?.note ?? '' : '',
            images: given?.images ?? [],
          },
        ];
      });

      return {
        title: group.title,
        // Only groups the tree says ask for these can store them.
        observedFrom: group.requiresTime ? submitted?.observedFrom ?? '' : '',
        observedTo: group.requiresTime ? submitted?.observedTo ?? '' : '',
        howObserved: group.requiresHow ? submitted?.howObserved ?? '' : '',
        notesLabel: group.notesLabel,
        notes: group.notesLabel ? submitted?.notes ?? '' : '',
        answers,
      };
    });

    return {
      key: section.key,
      title: section.title,
      subtitle: section.subtitle,
      groups,
      texts: section.textPrompts.map((label, i) => ({
        label,
        value: submittedSection?.texts[i] ?? '',
      })),
      score,
      scoreMax,
    };
  });
}

/**
 * The fields a stored record holds that don't come straight off the input.
 *
 * `score`, `scoreMax`, `avgScore` and `isComplete` are written here only so the
 * store's own records stay self-consistent — every read recomputes them in
 * `toWireSummary`, so a client cannot inflate any of them.
 */
function toStoredRecord(
  input: VisitInput,
  sections: RvpAnsweredSection[],
  base: {id: string; reference: string; reviewedBy: string},
): RvpSiteVisitDetail {
  const score = scoreOf(sections);
  const scoreMax = scoreMaxOf(sections);
  const visitType = VISIT_TYPE_IN[input.visitType] ?? 'Full Site Visit';

  return {
    id: base.id,
    reference: base.reference,
    program: input.program,
    operationManager: input.operationManager,
    // Resolved from the roster, never sent by the client.
    leaderPosition: rvpLeaderPositionFor(input.operationManager),
    startDate: input.startDate,
    endDate: input.endDate,
    reviewedBy: base.reviewedBy,
    updatedBy: 'You',
    updatedAt: new Date().toISOString(),
    score,
    scoreMax,
    avgScore: avgScoreOf(score, scoreMax),
    isComplete: isCompleteOf(sections),
    visitType,
    // A full site visit has no reason, whatever the client sent.
    reasonForVisit:
      visitType === 'Full Site Visit' ? '' : input.reasonForVisit ?? '',
    images: input.images ?? [],
    sections,
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

    rvpSiteVisitFormOptions: async () => {
      await sleep();
      return {
        nextReference: nextReference(),
        programs: RVP_PROGRAMS,
        visitTypes: Object.values(VISIT_TYPE_OUT),
        operationManagers: RVP_OPERATION_MANAGERS.map(m => m.name),
        sections: RVP_SECTIONS,
      };
    },
  },

  Mutation: {
    createRvpSiteVisit: async (_: unknown, args: {input: VisitInput}) => {
      await sleep();
      const reference = nextReference();
      const record = toStoredRecord(
        args.input,
        buildAnsweredSections(args.input),
        {
          id: `rvp_${reference.replace('#RVP-', '')}`,
          reference,
          // The RVP filing it is the reviewer, matching every other create here.
          reviewedBy: 'You',
        },
      );
      rvpSiteVisitStore.records.unshift(record);
      return toWireDetail(record);
    },

    updateRvpSiteVisit: async (
      _: unknown,
      args: {id: string; input: VisitInput},
    ) => {
      await sleep();
      const index = rvpSiteVisitStore.records.findIndex(r => r.id === args.id);
      if (index < 0) {
        throw new Error(`Unknown RVP site visit: ${args.id}`);
      }
      const existing = rvpSiteVisitStore.records[index];
      const record = toStoredRecord(
        args.input,
        buildAnsweredSections(args.input),
        {
          id: existing.id,
          reference: existing.reference,
          // Who filed it, not who last touched it — only updatedBy moves.
          reviewedBy: existing.reviewedBy,
        },
      );
      rvpSiteVisitStore.records[index] = record;
      return toWireDetail(record);
    },

    deleteRvpSiteVisit: async (_: unknown, args: {id: string}) => {
      await sleep();
      const index = rvpSiteVisitStore.records.findIndex(r => r.id === args.id);
      if (index < 0) {
        throw new Error(`Unknown RVP site visit: ${args.id}`);
      }
      rvpSiteVisitStore.records.splice(index, 1);
      return args.id;
    },
  },
};

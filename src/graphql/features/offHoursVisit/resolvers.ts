import {
  OffHoursChecklistAnswer,
  OffHoursQuestion,
  OffHoursRevealRule,
  OffHoursVisit,
} from '../../../types/offHoursVisit';
import {OFF_HOURS_QUESTIONS, OFF_HOURS_TYPE} from '../../../mocks/offHoursVisit';
import {PROGRAM_ZONES} from '../shared/options';
import {sleep} from '../../mockSession';
import {nextReference, offHoursVisitStore} from './store';

/**
 * Explicit maps rather than `.toUpperCase()` / `.toLowerCase()`: 'yesNo'
 * uppercases to 'YESNO', not the SDL's 'YES_NO'. Same convention as
 * observationReport's TYPE_OUT / TYPE_IN.
 *
 * Note this enum is *nested* — it sits on OffHoursQuestion inside the form
 * options payload, not at the top level of a response.
 */
export const REVEAL_OUT: Record<OffHoursRevealRule, string> = {
  any: 'ANY',
  yesNo: 'YES_NO',
};

export const REVEAL_IN: Record<string, OffHoursRevealRule> = {
  ANY: 'any',
  YES_NO: 'yesNo',
};

const toWireQuestion = (question: OffHoursQuestion) => ({
  ...question,
  reveal: REVEAL_OUT[question.reveal],
});

/** The best a report can score — summed from the questions, never a literal. */
function maxRating(): number {
  return OFF_HOURS_QUESTIONS.reduce(
    (total, question) =>
      total + question.options.reduce((best, o) => Math.max(best, o.points), 0),
    0,
  );
}

interface AnswerInput {
  key: string;
  answer: string;
  note?: string | null;
  images?: string[] | null;
}

interface VisitInput {
  capturedAt: string;
  zone: string;
  auditNotes?: string | null;
  answers: AnswerInput[];
}

/**
 * Builds the stored checklist from the submitted answers.
 *
 * Two rules matter here. Points come from the server's own option table, so a
 * client that miscounts cannot inflate a stored score. And the result is built
 * in question order rather than submission order, so a stored report always
 * reads top-to-bottom like the form did.
 *
 * An answer whose key or label doesn't resolve is dropped rather than stored
 * as a phantom entry.
 */
function buildChecklist(answers: AnswerInput[]): OffHoursChecklistAnswer[] {
  const byKey = new Map(answers.map(a => [a.key, a]));

  return OFF_HOURS_QUESTIONS.flatMap(question => {
    const submitted = byKey.get(question.key);
    if (!submitted) {
      return [];
    }
    const option = question.options.find(o => o.label === submitted.answer);
    if (!option) {
      return [];
    }
    return [
      {
        question: question.prompt,
        answer: option.label,
        points: option.points,
        // Both are nullable on the input. The app always sends them, but a
        // real gateway's client might not.
        note: submitted.note ?? '',
        images: submitted.images ?? [],
      },
    ];
  });
}

export const offHoursVisitResolvers = {
  Query: {
    offHoursVisitFormOptions: async () => {
      await sleep();
      return {
        nextReference: nextReference(),
        type: OFF_HOURS_TYPE,
        zones: PROGRAM_ZONES,
        questions: OFF_HOURS_QUESTIONS.map(toWireQuestion),
      };
    },
  },

  Mutation: {
    createOffHoursVisit: async (_: unknown, args: {input: VisitInput}) => {
      await sleep();
      const {input} = args;
      const reference = nextReference();
      const checklist = buildChecklist(input.answers);

      const record: OffHoursVisit = {
        id: `ohv_${reference.replace('#OHV-', '')}`,
        reference,
        type: OFF_HOURS_TYPE,
        capturedAt: input.capturedAt,
        zone: input.zone,
        rating: checklist.reduce((total, item) => total + item.points, 0),
        ratingMax: maxRating(),
        auditNotes: input.auditNotes ?? '',
        checklist,
        createdBy: 'You',
      };

      offHoursVisitStore.records.unshift(record);
      return record;
    },
  },
};

import {ObservationChecklistItem, ObservationReport} from '../../../types/observationReport';
import {AMB_NAMES, OBSERVATION_QUESTIONS, SUP_NAMES, ZONES} from '../../../mocks/observationReport';
import {sleep} from '../../mockSession';
import {findRecord, nextReference, observationReportStore} from './store';

const TYPE_OUT: Record<ObservationReport['type'], string> = {
  Ambassador: 'AMBASSADOR',
  Supervisor: 'SUPERVISOR',
};

const TYPE_IN: Record<string, ObservationReport['type']> = {
  AMBASSADOR: 'Ambassador',
  SUPERVISOR: 'Supervisor',
};

export const toWire = (record: ObservationReport) => ({
  ...record,
  type: TYPE_OUT[record.type],
});

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

interface AnswerInput {
  key: string;
  answer: string;
  note?: string | null;
}

interface ReportInput {
  type: string;
  name: string;
  zone: string;
  dateTime: string;
  answers: AnswerInput[];
  summary?: string | null;
  images?: string[] | null;
}

/**
 * Rebuilds the stored checklist from a submission, walking the server's own
 * fixed 5-question tree rather than the input — a key that doesn't resolve
 * is dropped, and the question text always comes from the tree, never the
 * client. Same convention as RVP's `buildAnsweredSections`.
 *
 * A question with no submitted answer — or any value that isn't literally
 * 'Yes' — stores as 'No' rather than 'Yes'. The client already requires all
 * five before it will submit, so this only matters for a request that
 * bypasses that check; defaulting to 'No' means a missing answer can never
 * silently inflate the score.
 */
function buildChecklist(input: ReportInput): ObservationChecklistItem[] {
  const answersByKey = new Map(input.answers.map(a => [a.key, a]));
  return OBSERVATION_QUESTIONS.map(question => {
    const given = answersByKey.get(question.key);
    const answer: ObservationChecklistItem['answer'] =
      given?.answer === 'Yes' ? 'Yes' : 'No';
    return {
      question: question.prompt,
      answer,
      note: given?.note ?? '',
    };
  });
}

/** Yes-count out of the fixed 5-question checklist. */
function scoreOf(checklist: ObservationChecklistItem[]): number {
  return checklist.filter(item => item.answer === 'Yes').length;
}

function toStoredRecord(
  input: ReportInput,
  base: {id: string; reference: string; date: string; dateTime: string},
): ObservationReport {
  const checklist = buildChecklist(input);
  return {
    id: base.id,
    reference: base.reference,
    type: TYPE_IN[input.type] ?? 'Ambassador',
    name: input.name,
    date: base.date,
    dateTime: base.dateTime,
    // The person filing the report is its own reviewer — same convention
    // RVP's create uses for `reviewedBy`.
    reviewedBy: {name: 'You'},
    zone: input.zone,
    score: scoreOf(checklist),
    summary: input.summary ?? '',
    checklist,
    images: input.images ?? [],
  };
}

export const observationReportResolvers = {
  Query: {
    // No filter argument: the screen filters, sorts and searches
    // client-side, same convention as fixtures.
    observationReports: async () => {
      await sleep();
      return observationReportStore.records.map(toWire);
    },

    observationReport: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findRecord(args.id);
      return record ? toWire(record) : null;
    },

    observationReportFormOptions: async () => {
      await sleep();
      return {
        nextReference: nextReference(),
        zones: ZONES,
        ambassadors: AMB_NAMES,
        supervisors: SUP_NAMES,
        questions: OBSERVATION_QUESTIONS,
      };
    },
  },

  Mutation: {
    createObservationReport: async (_: unknown, args: {input: ReportInput}) => {
      await sleep();
      const reference = nextReference();
      const dateTime = args.input.dateTime;
      const record = toStoredRecord(args.input, {
        id: `obr_${reference.replace('#OBR-', '')}`,
        reference,
        date: dateTime.slice(0, 10),
        dateTime,
      });
      observationReportStore.records.unshift(record);
      return toWire(record);
    },

    updateObservationReport: async (
      _: unknown,
      args: {id: string; input: ReportInput},
    ) => {
      await sleep();
      const index = observationReportStore.records.findIndex(r => r.id === args.id);
      if (index < 0) {
        throw new Error(`Unknown observation report: ${args.id}`);
      }
      const existing = observationReportStore.records[index];
      const dateTime = args.input.dateTime;
      const record = toStoredRecord(args.input, {
        id: existing.id,
        reference: existing.reference,
        date: dateTime.slice(0, 10),
        dateTime,
      });
      observationReportStore.records[index] = record;
      return toWire(record);
    },

    deleteObservationReport: async (_: unknown, args: {id: string}) => {
      await sleep();
      const index = observationReportStore.records.findIndex(r => r.id === args.id);
      if (index < 0) {
        throw new Error(`Unknown observation report: ${args.id}`);
      }
      observationReportStore.records.splice(index, 1);
      return args.id;
    },
  },
};

import {
  OffHoursChecklistAnswer,
  OffHoursQuestion,
  OffHoursVisit,
} from '../types/offHoursVisit';

/** Locked Type — this form only ever records off-hours visits. */
export const OFF_HOURS_TYPE = 'Off Hour Visit';

/*
 * The zone list this module used to own now lives in
 * `graphql/features/shared/options.ts` as `PROGRAM_ZONES` — Shift Notes serves
 * the same eight zones, and one list with two consumers beats two that drift.
 */

/**
 * The checklist, ported verbatim from the design's own `QS` — prompts,
 * hint text, option labels and per-option points included. Q1 and Q2 carry no
 * trailing question mark in the source; that is how they read, not a typo.
 *
 * Points run 0–4 per question, so today's five questions score out of 20. The
 * max is summed from this list rather than written down anywhere, so adding a
 * sixth question moves the denominator on its own.
 */
export const OFF_HOURS_QUESTIONS: OffHoursQuestion[] = [
  {
    key: 'q1',
    prompt:
      'What percentage of staff did you encounter on point and actively working?',
    hint: '(provide pictures for all)',
    options: [
      {label: 'Less than 25%', points: 1},
      {label: '25% - 80%', points: 2},
      {label: 'More than 80%', points: 4},
    ],
    reveal: 'any',
    numeric: false,
  },
  {
    key: 'q2',
    prompt:
      'Of the people you saw do you believe they were actively engaged with the public',
    hint: '(provide pictures)',
    options: [
      {label: 'Yes', points: 4},
      {label: 'No', points: 1},
    ],
    reveal: 'yesNo',
    numeric: false,
  },
  {
    key: 'q3',
    prompt:
      'Did you see equipment being used correctly and in line with your deployment plan?',
    hint: '(provide pictures)',
    options: [
      {label: 'Yes', points: 4},
      {label: 'No', points: 1},
    ],
    reveal: 'yesNo',
    numeric: false,
  },
  {
    key: 'q4',
    prompt: 'How would you rate the teams uniform appearance?',
    hint: '(provide pictures)',
    options: [
      {label: '1', points: 1},
      {label: '2', points: 2},
      {label: '3', points: 3},
      {label: '4', points: 4},
    ],
    reveal: 'any',
    numeric: true,
  },
  {
    key: 'q5',
    prompt:
      'How many violations of safety protocol (not using eye wear, not using gloves, etc.?)',
    hint: '(provide pictures)',
    options: [
      {label: '0', points: 4},
      {label: '1', points: 3},
      {label: '2', points: 2},
      {label: '3', points: 1},
      {label: '4', points: 0},
    ],
    reveal: 'any',
    numeric: true,
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const SEED_NOW = Date.now();

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Seeded records are dated relative to *today*, never to the design's own
 * fixed July 2026 clock. Nothing lists these today, so a stale date would be
 * invisible rather than wrong — seed them correctly anyway, so the trap does
 * not spring the day a portal-style read surface arrives.
 */
function isoAt(daysAgo: number, hour: number, minute: number): string {
  const d = new Date(SEED_NOW - daysAgo * DAY_MS);
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return `${date}T${pad(hour)}:${pad(minute)}:00`;
}

/**
 * Builds a checklist from answer labels positioned against OFF_HOURS_QUESTIONS,
 * resolving each label's points from the question itself so a seed can never
 * disagree with the scoring table. An unmatched label would be a mock bug, so
 * it scores 0 rather than silently picking an option.
 *
 * Images stay empty: the design's thumbnails are a stock JPG, and seeding
 * fake local URIs renders as broken tiles on device.
 */
function checklist(
  answers: string[],
  notes: Record<string, string> = {},
): OffHoursChecklistAnswer[] {
  return OFF_HOURS_QUESTIONS.map((question, i) => {
    const answer = answers[i];
    return {
      question: question.prompt,
      answer,
      points: question.options.find(o => o.label === answer)?.points ?? 0,
      note: notes[question.key] ?? '',
      images: [],
    };
  });
}

/**
 * The design's own filled-in form, submitted. Its answers score
 * 2 + 4 + 1 + 4 + 3 = 14 out of 20.
 *
 * Numbered 1186 so the first form opened in a session reserves #OHV-1187 —
 * the reference the mockup itself shows.
 */
const EXPLICIT: OffHoursVisit[] = [
  {
    id: 'ohv_1186',
    reference: '#OHV-1186',
    type: OFF_HOURS_TYPE,
    capturedAt: isoAt(1, 19, 25),
    zone: 'Downtown Louisville',
    rating: 14,
    ratingMax: 20,
    auditNotes:
      'Quiet overnight shift. Coverage was thin between 2–3 AM but the crew recovered the route; uniform and equipment issues noted above were corrected on site.',
    checklist: checklist(['25% - 80%', 'Yes', 'No', '4', '1'], {
      q1: 'Six of nine ambassadors were on point at the start of the walk; two were on an approved break.',
      q3: 'Blower in use without the deployment plan’s route — corrected with the crew lead on site.',
      q5: 'One ambassador working without cut-resistant gloves; spare pair issued from the van.',
    }),
    createdBy: 'Jane Smith',
  },
];

const GENERATED: OffHoursVisit[] = [
  {
    id: 'ohv_1185',
    reference: '#OHV-1185',
    type: OFF_HOURS_TYPE,
    capturedAt: isoAt(6, 22, 10),
    zone: 'RiverFront',
    rating: 18,
    ratingMax: 20,
    auditNotes:
      'Strong overnight coverage. Nothing outstanding from this walk.',
    checklist: checklist(['More than 80%', 'Yes', 'Yes', '3', '1'], {
      q1: 'Full crew on point across both loops.',
    }),
    createdBy: 'Jane Smith',
  },
  {
    id: 'ohv_1184',
    reference: '#OHV-1184',
    type: OFF_HOURS_TYPE,
    capturedAt: isoAt(13, 4, 40),
    zone: 'Southern Indiana',
    rating: 9,
    ratingMax: 20,
    auditNotes:
      'Early-morning walk. Two ambassadors unreachable by radio for most of the window — escalated to the shift lead.',
    checklist: checklist(['Less than 25%', 'No', 'Yes', '2', '2'], {
      q1: 'Only two of seven ambassadors located during the walk.',
      q2: 'Both ambassadors found were stationary and not engaging passers-by.',
      q5: 'Two ambassadors working without eye protection during edging.',
    }),
    createdBy: 'Jane Smith',
  },
];

export const MOCK_OFF_HOURS_VISITS: OffHoursVisit[] = [
  ...EXPLICIT,
  ...GENERATED,
];

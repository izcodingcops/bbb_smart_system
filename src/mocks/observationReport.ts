import {
  ObservationChecklistItem,
  ObservationQuestion,
  ObservationReport,
} from '../types/observationReport';

const QUESTIONS = [
  'Was the Ambassador on task during Observation?',
  'Did Ambassadors Uniform meet standards?',
  'Was the Ambassador actively engaged with public?',
  'Was the Ambassador adhering to safety standards? (PPE utilized, Observing BBB Rules)?',
  'Was a training topic/scenario covered?',
];

/**
 * The server's own question tree for the create/edit form — stable keys the
 * form's answer map uses, walked positionally against the same fixed
 * `QUESTIONS` list every record's checklist already denormalizes from.
 */
export const OBSERVATION_QUESTIONS: ObservationQuestion[] = QUESTIONS.map(
  (prompt, i) => ({key: `q${i + 1}`, prompt}),
);

function checklist(
  answers: ObservationChecklistItem['answer'][],
  notes: string[],
): ObservationChecklistItem[] {
  return QUESTIONS.map((question, i) => ({
    question,
    answer: answers[i],
    note: notes[i],
  }));
}

/**
 * `images` is added by `MOCK_OBSERVATION_REPORTS` below rather than on every
 * literal here — it's a real field on the type (the create form persists
 * locally-picked photo URIs, same as RVP), but no seed record has one.
 */
const EXPLICIT: Omit<ObservationReport, 'images'>[] = [
  {
    id: 'obr_2043', reference: '#OBR-2043', type: 'Ambassador',
    name: 'ambassador, test', date: '2026-07-17', dateTime: '2026-07-17T09:51:00',
    reviewedBy: {name: 'user 99, test'}, zone: 'Downtown Louisville', score: 5,
    summary: 'Ambassador stayed on task the entire shift, uniform sharp, engaged warmly with the public.',
    checklist: checklist(['Yes', 'Yes', 'Yes', 'Yes', 'Yes'], ['', '', 'Assisted three visitors with directions.', '', 'Reviewed radio-call protocol.']),
  },
  {
    id: 'obr_2039', reference: '#OBR-2039', type: 'Ambassador',
    name: 'Allie Barker', date: '2026-07-16', dateTime: '2026-07-16T08:22:00',
    reviewedBy: {name: 'Bridget Brownlee'}, zone: 'RiverFront', score: 5,
    summary: 'Strong public presence and consistent zone coverage throughout the audit window.',
    checklist: checklist(['Yes', 'Yes', 'Yes', 'Yes', 'N/A'], ['', '', '', '', 'No training scheduled today.']),
  },
  {
    id: 'obr_2031', reference: '#OBR-2031', type: 'Ambassador',
    name: 'Cam Hurd', date: '2026-07-10', dateTime: '2026-07-10T13:14:00',
    reviewedBy: {name: 'Chris Coulter'}, zone: 'Southern Indiana', score: 4,
    summary: 'On task and professional. Reminded to wear gloves during litter pickup.',
    checklist: checklist(['Yes', 'Yes', 'N/A', 'Yes', 'Yes'], ['', '', 'Limited foot traffic during window.', 'PPE corrected on the spot.', '']),
  },
  {
    id: 'obr_2024', reference: '#OBR-2024', type: 'Ambassador',
    name: 'Arslan saeed', date: '2026-07-09', dateTime: '2026-07-09T10:05:00',
    reviewedBy: {name: 'Will Campbell'}, zone: 'Beachmont', score: 5,
    summary: 'Excellent engagement, clean uniform, followed all BBB rules.',
    checklist: checklist(['Yes', 'Yes', 'Yes', 'Yes', 'Yes'], ['', '', '', '', '']),
  },
  // The three below are the Ambassador module handoff's own history for its
  // walkthrough ambassador (Arslan Saeed) — `obr_2024` above already covered
  // its newest one under a lowercase-surname scrape, which is why the
  // Ambassador module matches this store's `name` case-insensitively rather
  // than "fixing" that record. Ids sit below the generated AMB floor (1867)
  // so they never collide with it.
  {
    id: 'obr_1840', reference: '#OBR-1840', type: 'Ambassador',
    name: 'Arslan Saeed', date: '2026-04-28', dateTime: '2026-04-28T09:22:00',
    reviewedBy: {name: 'Bridget Brownlee'}, zone: 'Zone 1 - Blue', score: 5,
    summary: 'Excellent engagement, sharp uniform, followed every BBB rule during the sweep.',
    checklist: checklist(['Yes', 'Yes', 'Yes', 'Yes', 'Yes'], ['', '', 'Assisted three visitors with directions.', '', '']),
  },
  {
    id: 'obr_1810', reference: '#OBR-1810', type: 'Ambassador',
    name: 'Arslan Saeed', date: '2026-03-31', dateTime: '2026-03-31T13:48:00',
    reviewedBy: {name: 'Chris Coulter'}, zone: 'Zone 2 - Orange', score: 3,
    summary: 'Missing hi-vis vest at the start of shift; corrected within ten minutes.',
    checklist: checklist(['Yes', 'No', 'Yes', 'Yes', 'N/A'], ['', 'Vest retrieved from locker.', '', '', 'No training scheduled today.']),
  },
  {
    id: 'obr_1780', reference: '#OBR-1780', type: 'Ambassador',
    name: 'Arslan Saeed', date: '2026-02-17', dateTime: '2026-02-17T08:05:00',
    reviewedBy: {name: 'Teeya Barnes'}, zone: 'Zone 4 - Green', score: 2,
    summary: 'Observed off task twice; coaching provided on staying within the assigned zone.',
    checklist: checklist(['No', 'Yes', 'No', 'Yes', 'Yes'], ['On phone away from post twice.', '', 'Minimal interaction with public.', '', 'Covered de-escalation basics.']),
  },
  {
    id: 'obr_2016', reference: '#OBR-2016', type: 'Ambassador',
    name: 'Chad Williamson', date: '2026-07-07', dateTime: '2026-07-07T07:48:00',
    reviewedBy: {name: 'Tina Durbin'}, zone: 'South IN 2', score: 3,
    summary: 'Missing hi-vis vest at start of shift; corrected within ten minutes.',
    checklist: checklist(['Yes', 'No', 'Yes', 'Yes', 'N/A'], ['', 'Vest retrieved from locker.', '', '', '']),
  },
  {
    id: 'obr_2009', reference: '#OBR-2009', type: 'Ambassador',
    name: 'Asim Tester', date: '2026-07-05', dateTime: '2026-07-05T09:30:00',
    reviewedBy: {name: 'Michael Chou'}, zone: 'New July Zone 1', score: 2,
    summary: 'Observed off task twice; coaching provided on staying within assigned zone.',
    checklist: checklist(['No', 'Yes', 'No', 'Yes', 'Yes'], ['On phone away from post twice.', '', 'Minimal interaction with public.', '', 'Covered de-escalation basics.']),
  },
  {
    id: 'obr_2001', reference: '#OBR-2001', type: 'Ambassador',
    name: 'Clint Tester', date: '2026-07-03', dateTime: '2026-07-03T12:12:00',
    reviewedBy: {name: 'Stan Der-by'}, zone: 'test July 7', score: 5,
    summary: 'Model shift — proactive, courteous, thorough zone sweeps.',
    checklist: checklist(['Yes', 'Yes', 'Yes', 'Yes', 'Yes'], ['', '', '', '', '']),
  },
  {
    id: 'obr_1994', reference: '#OBR-1994', type: 'Ambassador',
    name: 'Bill Montgomery', date: '2026-07-01', dateTime: '2026-07-01T08:00:00',
    reviewedBy: {name: 'Kendrick Dale'}, zone: 'Downtown Louisville', score: 4,
    summary: 'Reliable coverage; encourage more proactive public greeting.',
    checklist: checklist(['Yes', 'Yes', 'No', 'Yes', 'Yes'], ['', '', 'Reserved with passersby.', '', '']),
  },
  {
    id: 'obr_3097', reference: '#OBR-3097', type: 'Supervisor',
    name: 'user2, test', date: '2026-07-21', dateTime: '2026-07-21T08:56:00',
    reviewedBy: {name: 'user2, test'}, zone: 'testzone2222', score: 5,
    summary: 'good',
    checklist: checklist(['Yes', 'Yes', 'Yes', 'Yes', 'Yes'], ['', '', '', '', '']),
  },
  {
    id: 'obr_3090', reference: '#OBR-3090', type: 'Supervisor',
    name: 'user, prod', date: '2026-07-19', dateTime: '2026-07-19T15:41:00',
    reviewedBy: {name: 'ambassador, test'}, zone: 'map box', score: 5,
    summary: 'Ran a clean, well-organized zone; team briefed and on task.',
    checklist: checklist(['Yes', 'Yes', 'Yes', 'Yes', 'Yes'], ['', '', '', '', 'Led a short training huddle.']),
  },
  {
    id: 'obr_3082', reference: '#OBR-3082', type: 'Supervisor',
    name: 'Tester, Olivia', date: '2026-07-19', dateTime: '2026-07-19T11:20:00',
    reviewedBy: {name: 'Asim, Muhammad'}, zone: 'RiverFront', score: 4,
    summary: 'Good oversight; ensure PPE checks are logged before dispatch.',
    checklist: checklist(['Yes', 'Yes', 'N/A', 'Yes', 'Yes'], ['', '', '', 'Reminded team on vest checks.', '']),
  },
  {
    id: 'obr_3081', reference: '#OBR-3081', type: 'Supervisor',
    name: 'Tester, Olivia', date: '2026-07-19', dateTime: '2026-07-19T09:05:00',
    reviewedBy: {name: 'Barnes, Teeya'}, zone: 'Southern Indiana', score: 5,
    summary: 'Strong leadership presence, engaged with the public alongside the team.',
    checklist: checklist(['Yes', 'Yes', 'Yes', 'Yes', 'Yes'], ['', '', '', '', '']),
  },
  {
    id: 'obr_3075', reference: '#OBR-3075', type: 'Supervisor',
    name: 'user, my', date: '2026-07-18', dateTime: '2026-07-18T14:15:00',
    reviewedBy: {name: 'Coulter, Chris'}, zone: 'TEST ZONE', score: 5,
    summary: 'Excellent shift management and clear communication.',
    checklist: checklist(['Yes', 'Yes', 'Yes', 'Yes', 'N/A'], ['', '', '', '', 'No topic scheduled.']),
  },
  {
    id: 'obr_3068', reference: '#OBR-3068', type: 'Supervisor',
    name: 'Bridget Brownlee', date: '2026-07-16', dateTime: '2026-07-16T10:48:00',
    reviewedBy: {name: 'Cox, Tahira'}, zone: 'Beachmont', score: 3,
    summary: 'Coverage adequate; training topic was not delivered this shift.',
    checklist: checklist(['Yes', 'Yes', 'Yes', 'Yes', 'No'], ['', '', '', '', 'Skipped due to staffing.']),
  },
  {
    id: 'obr_3060', reference: '#OBR-3060', type: 'Supervisor',
    name: 'Chico Lockhart', date: '2026-07-14', dateTime: '2026-07-14T07:33:00',
    reviewedBy: {name: 'dvp, test'}, zone: 'Downtown Louisville', score: 2,
    summary: 'Left post unattended; follow-up coaching required on supervision duties.',
    checklist: checklist(['No', 'Yes', 'No', 'Yes', 'No'], ['Off post for extended period.', '', 'Limited floor engagement.', '', '']),
  },
  {
    id: 'obr_3053', reference: '#OBR-3053', type: 'Supervisor',
    name: 'Clayton Ratledge', date: '2026-07-12', dateTime: '2026-07-12T16:02:00',
    reviewedBy: {name: 'Dev 2, Tester'}, zone: 'test', score: 4,
    summary: 'Solid oversight; encourage more consistent public engagement.',
    checklist: checklist(['Yes', 'Yes', 'No', 'Yes', 'Yes'], ['', '', 'Focused mostly on logistics.', '', '']),
  },
];

/** Also the create form's Ambassador picklist. */
export const AMB_NAMES = [
  'Jordan Blake', 'Priya Anand', 'Marcus Webb', 'Devon Reyes', 'Sasha Kim',
  'Elliot Cho', 'Nadia Brooks', 'Trevor Lang', 'Maya Solis', 'Ibrahim Noor',
  'Casey Flynn', 'Renee Ortiz',
];
/** Also the create form's Supervisor picklist. */
export const SUP_NAMES = [
  'Harold Byrne', 'Simone Iqbal', 'Dana Whitfield', 'Marcus Petrov',
  'Alicia Byun', 'Tomas Reyes', 'Nia Okonkwo', 'Felix Dumont',
  'Rosa Delgado', 'Ken Arata', 'Vivian Cross', 'Aiden Wolfe',
];
const REVIEWERS = [
  'user 99, test', 'user2, test', 'ambassador, test', 'Asim, Muhammad',
  'Barnes, Teeya', 'Coulter, Chris', 'Cox, Tahira', 'dvp, test',
  'Dev 2, Tester', 'Bridget Brownlee', 'Chris Coulter', 'Will Campbell',
  'Tina Durbin', 'Michael Chou', 'Stan Der-by', 'Kendrick Dale',
];
/** Also the create form's Zone picklist. */
export const ZONES = [
  'Beachmont', 'Downtown Louisville', 'LOOPER - update222', 'map box',
  'New July Zone 1', 'RiverFront', 'South IN 2', 'Southern Indiana',
  'Tes June Zone', 'test', 'test July 7', 'Test June 25', 'TEST ZONE',
  'testzone2222',
];
const GEN_SUMMARIES = [
  'Consistent coverage across the shift, no issues noted.',
  'Minor coaching point raised; otherwise on task throughout.',
  'Strong public engagement, uniform and PPE both in order.',
  'Zone sweep completed on schedule with no incidents.',
];
const GEN_ANSWER_SETS: ObservationChecklistItem['answer'][][] = [
  ['Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
  ['Yes', 'Yes', 'Yes', 'Yes', 'N/A'],
  ['Yes', 'No', 'Yes', 'Yes', 'Yes'],
  ['Yes', 'Yes', 'N/A', 'Yes', 'No'],
];

const DAY_MS = 24 * 60 * 60 * 1000;
const SEED_NOW = Date.now();

/** Spreads across today, yesterday, last-7, last-30 and this-month so every
 * Date Range bucket has at least one record, even though Date Range doesn't
 * filter — this is for the list not eyeballing as a wall of old dates. */
const DAYS_AGO = [0, 1, 3, 6, 9, 12, 15, 18, 21, 24, 27, 29];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isoAt(daysAgo: number, hour: number, minute: number) {
  const d = new Date(SEED_NOW - daysAgo * DAY_MS);
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return {date, dateTime: `${date}T${pad(hour)}:${pad(minute)}:00`};
}

function generate(
  type: 'Ambassador' | 'Supervisor',
  names: string[],
  idFloor: number,
): Omit<ObservationReport, 'images'>[] {
  return names.map((name, i) => {
    const {date, dateTime} = isoAt(DAYS_AGO[i], 8 + (i % 6), (i * 11) % 60);
    const num = idFloor - i * 3;
    const prefix = type === 'Ambassador' ? 'AMB' : 'SUP';
    const answers = GEN_ANSWER_SETS[i % GEN_ANSWER_SETS.length];
    return {
      id: `obr_gen_${prefix.toLowerCase()}_${num}`,
      reference: `#OBR-${num}`,
      type,
      name,
      date,
      dateTime,
      reviewedBy: {name: REVIEWERS[i % REVIEWERS.length]},
      zone: ZONES[i % ZONES.length],
      // Yes-count, so the score always agrees with the checklist it's paired
      // with — an unrelated cyclical array here once showed Jordan Blake at
      // 1/5 despite an all-Yes checklist (real bug, fixed 2026-08-18).
      score: answers.filter(a => a === 'Yes').length,
      summary: GEN_SUMMARIES[i % GEN_SUMMARIES.length],
      checklist: checklist(answers, ['', '', '', '', '']),
    };
  });
}

// Lowest explicit AMB id is 1994, lowest SUP id is 3053 — floors sit well
// below both so generated ids never collide with the explicit set.
const GENERATED: Omit<ObservationReport, 'images'>[] = [
  ...generate('Ambassador', AMB_NAMES, 1900),
  ...generate('Supervisor', SUP_NAMES, 2900),
];

export const MOCK_OBSERVATION_REPORTS: ObservationReport[] = [...EXPLICIT, ...GENERATED].map(
  record => ({...record, images: []}),
);

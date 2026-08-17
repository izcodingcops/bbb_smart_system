import {
  RvpAnsweredGroup,
  RvpAnsweredSection,
  RvpAnswerValue,
  RvpSection,
  RvpSiteVisitDetail,
} from '../types/rvpSiteVisit';

/* ------------------------------------------------------------------ *
 * Dates
 *
 * Captured once at module load and expressed relative to it — the same
 * technique src/mocks/incident.ts and src/mocks/dispatch.ts use — so this seed
 * cannot go stale the way three separate mock files in this app already have.
 * The design's own clock (July 2026) is deliberately not copied.
 * ------------------------------------------------------------------ */

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Formats back to the same timezone-naive shape the other mocks use. */
function toLocalIso(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

const MINUTE = 60 * 1000;
const SEED_NOW = Date.now();

/** Midnight `dayOffset` days from the day `t` falls on, in the device timezone. */
function startOfDay(t: number, dayOffset: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return d.getTime();
}

/**
 * `minutes` into the day that fell `daysAgo` days ago. Clamped to now, so
 * nothing that records when something *happened* is seeded into the future.
 */
function seedAt(daysAgo: number, minutes: number): string {
  return toLocalIso(
    new Date(Math.min(startOfDay(SEED_NOW, -daysAgo) + minutes * MINUTE, SEED_NOW)),
  );
}

/**
 * Midnight `daysAgo` days ago, **unclamped** — a visit's End Date legitimately
 * runs past the day the report was last updated (the design's `#RVP-1186`
 * closes two weeks after its last edit), so this one must be allowed to land in
 * the future. Carries a time component on purpose: a date-only string parses as
 * UTC midnight and renders a day early west of Greenwich, which is the bug
 * `7b94d42` fixed in Observation Reports.
 */
function seedDay(daysAgo: number): string {
  return toLocalIso(new Date(startOfDay(SEED_NOW, -daysAgo)));
}

/* ------------------------------------------------------------------ *
 * Option lists — from the mockup's own FILTER_OPTS and create form
 * ------------------------------------------------------------------ */

/**
 * The programs an RVP files against. Deliberately **not** `MOCK_PROGRAMS`,
 * which is the roster behind the program switcher — which program the user is
 * clocked into. This is the site being visited, a different axis.
 *
 * The create form in the mockup defaults to 'Louisville KY Training BBB 0000',
 * which appears nowhere in its own filter list; the list's spelling is
 * 'Louisville KY Training BID 1000'. Two records would never have matched their
 * own Program filter, so the list's spelling is the one kept here. Don't
 * "restore" the other one.
 */
export const RVP_PROGRAMS = [
  'Akron OH Downtown Akron Partnership 1350',
  'Akron OH University of Akron 5300',
  'Albuquerque NM Downtown 3300',
  'Albuquerque NM Nob Hill 3300',
  'Albuquerque NM Route 66 & Coors 3300',
  'Albuquerque NM Uptown 3300',
  'Allentown PA Downtown Alliance 6750',
  'Arlington TX Downtown Arlington Mgmt Corp 6380',
  'Arlington VA Rosslyn BID 4100',
  'Atlanta GA Beltline 6590',
  'Augusta GA Clean Augusta Downtown Initiative 6020',
  'Austin TX DAA Downtown Austin Alliance 5390',
  'Austin TX DAA First Responders 5390',
  'Austin TX DAA Public Restroom 5390',
  'Louisville KY Training BID 1000',
  'MY PROGRAM 12345',
];

/**
 * Reviewer filter options, in the customer's own `Last , First` form with the
 * spacing the source uses — a space either side of the comma. That is what the
 * sheet displays; `flipName` in the screen's filtering.ts is what bridges it to
 * the `First Last` spelling the records carry.
 */
export const RVP_REVIEWERS = [
  'ambassador , test',
  'Asim , Muhammad',
  'Barnes , Teeya',
  'Boone Jr. , Anthony',
  'Brownlee , Bridget',
  'Campbell , Will',
  'Chou , Michael',
  'Coulter , Chris',
  'Cox , Tahira',
  'Dale , Kendrick',
  'Der-by , Stan',
  'Dev 2 , Tester',
  'Durbin , Tina',
  'Rizvi , Ahsann',
  'Tester , Olivia',
];

export const RVP_LEADER_POSITIONS = [
  'Divisional Vice President',
  'Management',
  'Regional Vice President',
  'System Administration',
];

/** The create form's Operation Manager list — the records draw their OMs from it. */
export const RVP_OPERATION_MANAGERS = [
  'Waqas Ahmed',
  'Michael Chou',
  'Teeya Barnes',
  'Anthony Boone Jr.',
  'Bridget Brownlee',
  'Will Campbell',
  'Tahira Cox',
  'Kendrick Dale',
  'Stan Der-by',
  'Tina Durbin',
];

/* ------------------------------------------------------------------ *
 * The question tree — 74 questions across 10 sections
 *
 * Transcribed verbatim from the handoff's rvp-sections.js. The wording,
 * punctuation and inconsistencies are the customer's: curly apostrophes, the em
 * dash and missing full stop in 'Safety — Tires, Light, etc', the 'upto date'
 * spelling, the 'Calender' spelling. Don't tidy them.
 *
 * Yes = 1 point, No = 0. There is deliberately no N/A and every question is
 * required — stated outright in the source's own header comment.
 * ------------------------------------------------------------------ */

interface GroupSeed {
  title: string;
  requiresTime?: boolean;
  requiresHow?: boolean;
  notesLabel?: string;
  questions: string[];
}

interface SectionSeed {
  key: string;
  title: string;
  subtitle: string;
  groups: GroupSeed[];
  textPrompts?: string[];
}

const VISIBILITY_QUESTIONS = [
  'Observed at least 70% of scheduled Ambassadors',
  'Ambassador appearance represents the customer and Block by Block',
  'Ambassador proactively greeted the public',
  'Visible name tags',
];

const SECTION_SEEDS: SectionSeed[] = [
  {
    key: 'field',
    title: 'Field Operations',
    subtitle: 'Ambassador visibility, cleanliness & duty phone',
    groups: [
      {
        title: 'DayTime Ambassador visibility and appearance',
        requiresTime: true,
        requiresHow: true,
        notesLabel: 'Observation notes',
        questions: VISIBILITY_QUESTIONS,
      },
      {
        title: 'Evenings / Weekends: Ambassador visibility & appearance',
        requiresTime: true,
        requiresHow: true,
        notesLabel: 'Observation notes',
        questions: VISIBILITY_QUESTIONS,
      },
      {
        title: 'Ambassadors are knowledgeable about',
        questions: [
          'Recent training',
          'District recommendations / happenings',
          'Ambassadors are familiar with the 5 Steps to a Great Public Engagement',
        ],
      },
      {
        title: 'District was visibly clean',
        questions: [
          'Dated litter and debris',
          'Graffiti',
          'Weeds',
          'Spills & stains on sidewalk',
          'Attention to detail (ex — trash can lids were wiped, remnants of stickers were off fixtures etc.)',
        ],
      },
      {
        title: 'Duty phone interaction',
        questions: [
          'Was answered',
          'Ambassador answering was friendly, helpful and understandable',
        ],
      },
    ],
  },
  {
    key: 'hr',
    title: 'HR Observation',
    subtitle: 'Records, postings, training & recognition',
    groups: [
      {
        title: 'HR Observations',
        questions: [
          'Attendance records are accurately kept',
          'HR Hotline poster posted',
          'Counseling and Disciplinary forms are kept',
          'Training records are upto date in the Learning management system (LMS)',
          'Awards, recognition and culture initiatives are in place',
        ],
      },
    ],
  },
  {
    key: 'org',
    title: 'Organizational Observation',
    subtitle: 'Equipment, supplies & uniform inventory',
    groups: [
      {
        title: 'Equipment is utilized',
        questions: [
          'Physically see it used',
          'Deployment plan in place',
          'Equipment inspections are in place',
        ],
      },
      {
        title: 'Equipment appearance',
        notesLabel: 'Notes',
        questions: [
          'Clean exterior',
          'Interior clean and well maintained',
          'Customer branding intact',
          'Safety — Tires, Light, etc',
        ],
      },
      {
        title: 'Supplies are locked and only accessible by manager / TL',
        questions: [
          'Are supplies organized and is there an appropriate stock based on program size',
        ],
      },
      {
        title: 'Uniform inventory',
        questions: [
          'Is the uniform stock secured and is there an appropriate stock based on program size',
        ],
      },
    ],
  },
  {
    key: 'safe',
    title: 'Safe Workspace Observation',
    subtitle: 'Safety standards, OSHA & compliance',
    groups: [
      {
        title: 'Safe Workplace Observations',
        questions: [
          'Are there any safety violations identified while on this visit?',
          'Safety Stretches are completed and seem to be a daily standard?',
          'Safety talks are completed',
          'Safety committee is identified and active',
          'Accidents from previous quarter were reviewed',
          'OSHA Binders are readily accessible and appear to be complete',
          'Eye wash stations are easy to find and wash is not expired',
          'STA visibility (posters, Safety ‘zone’, bracelets, etc.)',
        ],
      },
    ],
  },
  {
    key: 'fin',
    title: 'Financial',
    subtitle: 'Hours, wages, banked hours & budget',
    groups: [
      {
        title: 'Financial',
        questions: [
          'Scheduled hours are within 95% contract',
          'Monthly wage average report is within the range of info specified on CSF',
          'Banked hours are within 10% of weekly schedule',
          'Expense lines are within 95% of the budget',
        ],
      },
    ],
  },
  {
    key: 'admin',
    title: 'Administrative',
    subtitle: 'Kronos, coding, folders & licensure',
    groups: [
      {
        title: 'Administrative',
        questions: [
          'Kronos is reviewed and up to date, clock is functional',
          'Schedule for the next two weeks is posted',
          'Data basics coding is up to date',
          'AVID coding is up to date',
          'Location folders are up to date with updated Emergency Action Plan and Annual Calender',
          'Local licensure: All ambassadors are in possession of license',
          'Local licensure: All necessary branch / local postings are visible',
        ],
      },
    ],
  },
  {
    key: 'smart',
    title: 'Smart System',
    subtitle: 'Walk paths, audits, stats & devices',
    groups: [
      {
        title: 'Smart System',
        questions: [
          'Review of all walk paths with the manager investigating abnormalities',
          'Review of supervisor audits with manager to investigate abnormalities',
          'Review of daily and weekly view stats with the manager investigating abnormalities',
          'Review of stats by Ambassador with the manager to investigate abnormalities',
          'A quality monthly report is produced each month',
          'Condition and quantity of devices are based on inspection',
        ],
      },
    ],
    textPrompts: ['Overall SMART SYSTEM observations and recommendations'],
  },
  {
    /*
     * DRAFTED, not transcribed. The source file states that no screenshot was
     * supplied for this section and that its five questions were written from
     * the other sections' pattern. It is the one section whose wording is the
     * designer's rather than the customer's — flagged for the owner's review
     * rather than silently treated as authoritative.
     */
    key: 'amb',
    title: 'Ambassador Interaction',
    subtitle: 'Ambassador feedback & engagement',
    groups: [
      {
        title: 'Ambassador Interactions',
        questions: [
          'Ambassadors know their manager and RVP by name',
          'Ambassadors feel supported by their management team',
          'Ambassadors are aware of the district’s goals and priorities',
          'Ambassadors receive regular feedback and coaching',
          'Ambassadors feel safe raising concerns or safety issues',
        ],
      },
    ],
    textPrompts: ['Notes regarding ambassador interactions'],
  },
  {
    key: 'om',
    title: 'OM Interactions',
    subtitle: 'Manager feedback & development',
    groups: [
      {
        title: 'OM Feedback',
        questions: [
          'Time spent in field',
          'Off hours visits completed by manager in the previous quarter',
          'Manager’s attention to detail',
        ],
      },
    ],
    textPrompts: [
      'Opportunities for improvement, growth or development for the manager',
      'Paste your follow up email to your manager here',
    ],
  },
  {
    key: 'cust',
    title: 'Customer Interaction',
    subtitle: 'Customer expectations & follow-up',
    groups: [
      {
        title: 'Customer Interactions',
        questions: [
          'As an RVP how frequently do you interact with the customer',
          'Customer believes expectations are met',
          'Customer feels OM responds in a timely manner',
          'Customer feels OM is aware of street operations',
          'Customer feels OM is proactive in identifying problems',
          'Customer feels Ambassador adequately represents the organization',
          'Customer feels OM creates a positive culture for Ambassador staff',
          'Was a formal strategic plan delivered to the customer?',
          'Was a presentation to the board / committee completed during this visit?',
        ],
      },
    ],
    textPrompts: [
      'Notes regarding customer interactions',
      'Customer concerns',
      'Paste your follow up email to your manager here',
      'Overall opportunities for enhancement',
    ],
  },
];

/** Keys are generated, stable and never positional indexes on the wire. */
export const RVP_SECTIONS: RvpSection[] = SECTION_SEEDS.map(section => ({
  key: section.key,
  title: section.title,
  subtitle: section.subtitle,
  textPrompts: section.textPrompts ?? [],
  groups: section.groups.map((group, gi) => ({
    key: `${section.key}.g${gi}`,
    title: group.title,
    requiresTime: group.requiresTime ?? false,
    requiresHow: group.requiresHow ?? false,
    notesLabel: group.notesLabel ?? '',
    questions: group.questions.map((prompt, qi) => ({
      key: `${section.key}.g${gi}.q${qi}`,
      prompt,
    })),
  })),
}));

/** 74. Counted from the tree so it can never drift from it. */
export const RVP_TOTAL_QUESTIONS = RVP_SECTIONS.reduce(
  (total, section) =>
    total + section.groups.reduce((n, group) => n + group.questions.length, 0),
  0,
);

/* ------------------------------------------------------------------ *
 * Answer generation
 * ------------------------------------------------------------------ */

/** The source's own three note strings, rotated across the No answers. */
const NOTES = [
  'Flagged with the OM on site; corrective plan agreed for next week.',
  'Photos taken during the walk — added to the manager’s action list.',
  'Discussed with the team lead; will be re-checked at the next visit.',
];

const HOW_OBSERVED =
  'Walked the district with the Operations Manager, north-to-south loop.';
const GROUP_NOTES = 'District walked with the OM; findings shared the same day.';

/** The source's seeded free-text answers, keyed by section. */
const TEXT_VALUES: Record<string, string[]> = {
  smart: ['Walk paths reviewed with the OM; two device gaps logged for replacement.'],
  amb: [
    'Spoke with four ambassadors on route; morale is good, coaching cadence is inconsistent.',
  ],
  om: [
    'Delegate the daily walk report to the team leads and focus on customer touchpoints.',
    'Hi — thanks for the walk today. Recap: schedule posting, AVID coding, and two equipment items.',
  ],
  cust: [
    'Met the BID director for 40 minutes; pleased with response times this quarter.',
    'Weekend litter coverage on the east blocks.',
    'Recap of the customer meeting and the two commitments we made on weekend coverage.',
    'Add a Saturday sweep in the east zone and share the monthly report with the board.',
  ],
};

/**
 * Deterministic scatter key — a pure function of (index, seed).
 *
 * Arithmetic only, no bit twiddling: the repo's lint config bans `no-bitwise`,
 * and multiplying by a large constant modulo a prime scatters 74 indexes
 * perfectly well. Every index maps to a distinct key because the modulus is far
 * larger than the tree.
 */
function hash(index: number, seed: number): number {
  return ((index + 1) * 2654435761 + seed * 40503) % 1000003;
}

/**
 * Builds a record's answers.
 *
 * Three rules hold this together:
 *
 * 1. **Deterministic** — a pure function of `(seed, index)`, never
 *    `Math.random()`, or the smoke assertions and the seed disagree between
 *    runs. The stride walk spreads the No answers across sections instead of
 *    clumping them all in the first one.
 * 2. **`unanswered` leaves the last N questions of the tree absent entirely.**
 *    That is the only lever that makes a record incomplete, so `isComplete`
 *    stays derivable from "every question answered" rather than being a stored
 *    flag the answers could contradict.
 * 3. **`unanswered` must not disturb the score.** Dropping questions that would
 *    have been Yes would pull the record's score, and `avgScore` with it, away
 *    from the number the design states. So the No answers are allocated from
 *    the dropped tail inward, and the invariant is asserted below rather than
 *    left as a comment for a later edit to break silently.
 */
export function buildSections(
  yesCount: number,
  seed: number,
  unanswered = 0,
): RvpAnsweredSection[] {
  const answeredCount = RVP_TOTAL_QUESTIONS - unanswered;
  if (yesCount > answeredCount) {
    throw new Error(
      `RVP seed: ${yesCount} Yes answers cannot fit in ${answeredCount} answered questions`,
    );
  }

  /*
   * Which flat question indexes are answered No, scattered across the whole
   * tree rather than clumped in the first section.
   *
   * Deliberately a hash-and-take rather than a `(step * stride + seed) % n`
   * walk: a fixed stride only enumerates every index when it is coprime with
   * `n`, and `n` varies here with `unanswered` (63 answered questions against a
   * stride of 7 reaches nine distinct values, so the fill loop would never
   * terminate). Sorting by a deterministic hash always terminates and is just
   * as reproducible.
   */
  const noTarget = answeredCount - yesCount;
  const noIndexes = new Set(
    Array.from({length: answeredCount}, (_, i) => i)
      .sort((a, b) => hash(a, seed) - hash(b, seed))
      .slice(0, noTarget),
  );

  let flatIndex = -1;
  let noSeen = 0;

  return RVP_SECTIONS.map(section => {
    let sectionScore = 0;
    let sectionMax = 0;

    const groups: RvpAnsweredGroup[] = section.groups.map(group => {
      const answers = group.questions.flatMap(question => {
        flatIndex++;
        sectionMax++;
        if (flatIndex >= answeredCount) {
          return [];
        }
        const isNo = noIndexes.has(flatIndex);
        const answer: RvpAnswerValue = isNo ? 'No' : 'Yes';
        if (!isNo) {
          sectionScore++;
        }
        const note = isNo ? NOTES[noSeen++ % NOTES.length] : '';
        return [
          {
            question: question.prompt,
            answer,
            note,
            // The design's thumbnails are one stock JPEG. Seeding fake local
            // URIs here would render as broken tiles on device.
            images: [] as string[],
          },
        ];
      });

      return {
        title: group.title,
        observedFrom: group.requiresTime ? seedAt(0, 8 * 60 + 15) : '',
        observedTo: group.requiresTime ? seedAt(0, 11 * 60 + 40) : '',
        howObserved: group.requiresHow ? HOW_OBSERVED : '',
        notesLabel: group.notesLabel,
        notes: group.notesLabel ? GROUP_NOTES : '',
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
        value: TEXT_VALUES[section.key]?.[i] ?? '',
      })),
      score: sectionScore,
      scoreMax: sectionMax,
    };
  });
}

/* ------------------------------------------------------------------ *
 * Records
 * ------------------------------------------------------------------ */

interface RecordSeed {
  reference: string;
  operationManager: string;
  leaderPosition: string;
  program: string;
  reviewedBy: string;
  updatedBy: string;
  /** Days before today the report was last updated. */
  updatedDaysAgo: number;
  /** Minutes into that day. */
  updatedMinutes: number;
  startDaysAgo: number;
  endDaysAgo: number;
  /**
   * Chosen as `round(avg / 5 × 74)` from the design's own stated average, so
   * `avgScore` comes back out at the design's number to one decimal.
   */
  yesCount: number;
  /** Non-zero only on the design's `complete: false` rows. */
  unanswered?: number;
  visitType?: RvpSiteVisitDetail['visitType'];
  reasonForVisit?: string;
}

/**
 * The mockup's twelve REPORTS rows. Reference, manager, position, program,
 * reviewer and updater are verbatim; the dates are re-based relative to today,
 * preserving the source's day-spacing, because the design's July 2026 clock was
 * already a month stale when this shipped.
 *
 * The offsets are chosen so every Date Range bucket has a record in it (today,
 * yesterday, within 7 days, within 30 days) and every Score bucket has one too
 * (<2, 2-3, 3-5). Both are asserted in scripts/graphqlSmoke.ts.
 *
 * One inconsistency in the source is not reproduced: it orders its list by a
 * separate `ts` field that disagrees with the clock times printed on those same
 * rows — `#RVP-1188` leads at 10:11 AM while `#RVP-1187` sits below it at
 * 11:52 AM. The design's card shows a date without a time, so the contradiction
 * is invisible there. `updatedAt` is the only timestamp a record here carries,
 * so it drives the sort, which puts those two the other way round.
 */
const EXPLICIT_SEEDS: RecordSeed[] = [
  {reference: '#RVP-1188', operationManager: 'Waqas Ahmed', leaderPosition: 'Regional Vice President', program: 'Louisville KY Training BID 1000', reviewedBy: 'Ahsann Rizvi', updatedBy: 'Ahsann Rizvi', updatedDaysAgo: 0, updatedMinutes: 10 * 60 + 11, startDaysAgo: 0, endDaysAgo: 0, yesCount: 65},
  {reference: '#RVP-1187', operationManager: 'test', leaderPosition: 'System Administration', program: 'MY PROGRAM 12345', reviewedBy: 'Ahsann Rizvi', updatedBy: 'Ahsann Rizvi', updatedDaysAgo: 0, updatedMinutes: 11 * 60 + 52, startDaysAgo: 0, endDaysAgo: -1, yesCount: 44},
  {reference: '#RVP-1186', operationManager: 'Marcus Webb', leaderPosition: 'Management', program: 'Louisville KY Training BID 1000', reviewedBy: 'Ahsann Rizvi', updatedBy: 'Ahsann Rizvi', updatedDaysAgo: 0, updatedMinutes: 10 * 60 + 13, startDaysAgo: 0, endDaysAgo: -14, yesCount: 13},
  {reference: '#RVP-1181', operationManager: 'Michael Chou', leaderPosition: 'Divisional Vice President', program: 'Austin TX DAA Downtown Austin Alliance 5390', reviewedBy: 'Muhammad Asim', updatedBy: 'Muhammad Asim', updatedDaysAgo: 1, updatedMinutes: 16 * 60 + 22, startDaysAgo: 2, endDaysAgo: 1, yesCount: 59},
  {reference: '#RVP-1174', operationManager: 'Teeya Barnes', leaderPosition: 'Regional Vice President', program: 'Atlanta GA Beltline 6590', reviewedBy: 'Ahsann Rizvi', updatedBy: 'Olivia Tester', updatedDaysAgo: 2, updatedMinutes: 9 * 60 + 38, startDaysAgo: 3, endDaysAgo: 2, yesCount: 53},
  {reference: '#RVP-1169', operationManager: 'Anthony Boone Jr.', leaderPosition: 'Management', program: 'Arlington VA Rosslyn BID 4100', reviewedBy: 'Chris Coulter', updatedBy: 'Chris Coulter', updatedDaysAgo: 4, updatedMinutes: 13 * 60 + 5, startDaysAgo: 5, endDaysAgo: 4, yesCount: 43, unanswered: 6},
  {reference: '#RVP-1163', operationManager: 'Bridget Brownlee', leaderPosition: 'Divisional Vice President', program: 'Albuquerque NM Nob Hill 3300', reviewedBy: 'Ahsann Rizvi', updatedBy: 'Ahsann Rizvi', updatedDaysAgo: 6, updatedMinutes: 8 * 60 + 47, startDaysAgo: 7, endDaysAgo: 6, yesCount: 70},
  {reference: '#RVP-1158', operationManager: 'Will Campbell', leaderPosition: 'System Administration', program: 'Akron OH Downtown Akron Partnership 1350', reviewedBy: 'Olivia Tester', updatedBy: 'Ahsann Rizvi', updatedDaysAgo: 8, updatedMinutes: 15 * 60 + 19, startDaysAgo: 9, endDaysAgo: 8, yesCount: 36},
  {reference: '#RVP-1152', operationManager: 'Tahira Cox', leaderPosition: 'Regional Vice President', program: 'Augusta GA Clean Augusta Downtown Initiative 6020', reviewedBy: 'Ahsann Rizvi', updatedBy: 'Muhammad Asim', updatedDaysAgo: 10, updatedMinutes: 10 * 60 + 2, startDaysAgo: 11, endDaysAgo: 10, yesCount: 49},
  {reference: '#RVP-1147', operationManager: 'Kendrick Dale', leaderPosition: 'Management', program: 'Allentown PA Downtown Alliance 6750', reviewedBy: 'Ahsann Rizvi', updatedBy: 'Ahsann Rizvi', updatedDaysAgo: 12, updatedMinutes: 9 * 60 + 7, startDaysAgo: 13, endDaysAgo: 12, yesCount: 14, unanswered: 11},
  {reference: '#RVP-1141', operationManager: 'Stan Der-by', leaderPosition: 'Divisional Vice President', program: 'Arlington TX Downtown Arlington Mgmt Corp 6380', reviewedBy: 'Chris Coulter', updatedBy: 'Ahsann Rizvi', updatedDaysAgo: 14, updatedMinutes: 14 * 60 + 44, startDaysAgo: 15, endDaysAgo: 14, yesCount: 58},
  {reference: '#RVP-1136', operationManager: 'Tina Durbin', leaderPosition: 'Regional Vice President', program: 'Albuquerque NM Uptown 3300', reviewedBy: 'Ahsann Rizvi', updatedBy: 'Olivia Tester', updatedDaysAgo: 15, updatedMinutes: 11 * 60 + 31, startDaysAgo: 16, endDaysAgo: 15, yesCount: 27, unanswered: 9},
];

/** Three more for a fuller list, including the two non-default visit types. */
const GENERATED_SEEDS: RecordSeed[] = [
  {reference: '#RVP-1131', operationManager: 'Michael Chou', leaderPosition: 'Divisional Vice President', program: 'Austin TX DAA First Responders 5390', reviewedBy: 'Muhammad Asim', updatedBy: 'Muhammad Asim', updatedDaysAgo: 20, updatedMinutes: 10 * 60 + 55, startDaysAgo: 21, endDaysAgo: 20, yesCount: 62, visitType: 'Drop In Visit', reasonForVisit: 'Following up on the weekend litter coverage the customer raised.'},
  {reference: '#RVP-1126', operationManager: 'Bridget Brownlee', leaderPosition: 'Divisional Vice President', program: 'Albuquerque NM Downtown 3300', reviewedBy: 'Chris Coulter', updatedBy: 'Chris Coulter', updatedDaysAgo: 25, updatedMinutes: 14 * 60 + 8, startDaysAgo: 26, endDaysAgo: 25, yesCount: 31, visitType: 'Special Purpose', reasonForVisit: 'Safety committee stand-up after the Q2 incident review.'},
  {reference: '#RVP-1119', operationManager: 'Will Campbell', leaderPosition: 'System Administration', program: 'Akron OH University of Akron 5300', reviewedBy: 'Olivia Tester', updatedBy: 'Olivia Tester', updatedDaysAgo: 28, updatedMinutes: 9 * 60 + 26, startDaysAgo: 29, endDaysAgo: 28, yesCount: 51},
];

function toRecord(seed: RecordSeed, index: number): RvpSiteVisitDetail {
  const sections = buildSections(seed.yesCount, index * 3 + 1, seed.unanswered ?? 0);
  const score = sections.reduce((total, section) => total + section.score, 0);
  const scoreMax = sections.reduce((total, section) => total + section.scoreMax, 0);

  return {
    id: `rvp_${seed.reference.replace('#RVP-', '')}`,
    reference: seed.reference,
    program: seed.program,
    operationManager: seed.operationManager,
    leaderPosition: seed.leaderPosition,
    startDate: seedDay(seed.startDaysAgo),
    endDate: seedDay(seed.endDaysAgo),
    reviewedBy: seed.reviewedBy,
    updatedBy: seed.updatedBy,
    updatedAt: seedAt(seed.updatedDaysAgo, seed.updatedMinutes),
    score,
    scoreMax,
    // Recomputed by the resolver on every read; carried here so the store's own
    // records are internally consistent if something reads them directly.
    avgScore: Math.round((score / scoreMax) * 5 * 10) / 10,
    isComplete: (seed.unanswered ?? 0) === 0,
    visitType: seed.visitType ?? 'Full Site Visit',
    reasonForVisit: seed.reasonForVisit ?? '',
    images: [],
    sections,
  };
}

export const MOCK_RVP_SITE_VISITS: RvpSiteVisitDetail[] = [
  ...EXPLICIT_SEEDS,
  ...GENERATED_SEEDS,
].map(toRecord);

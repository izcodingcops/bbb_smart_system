import {
  AppNotification,
  NotificationRecordType,
  NotificationTarget,
} from '../types/notification';
import {MOCK_MAINTENANCE_REQUESTS} from './maintenance';
import {MOCK_FIXTURES} from './fixture';
import {MOCK_INCIDENTS} from './incident';
import {MOCK_POIS} from './poi';
import {MOCK_WORK_LOG_ENTRIES} from './workLog';

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

/**
 * Captured once at module load, the same technique src/mocks/incident.ts uses,
 * so the feed cannot go stale the way three separate mock files in this app
 * already have.
 */
const SEED_NOW = Date.now();

/** Midnight `dayOffset` days from the day `t` falls on, in the device timezone. */
function startOfDay(t: number, dayOffset: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return d.getTime();
}

/**
 * `minutes` before now, floored at five past midnight. The floor is what keeps
 * the Today group non-empty when the app is opened just after midnight — a raw
 * subtraction would quietly push every "today" record into Yesterday.
 */
function minutesAgo(minutes: number): string {
  const floor = startOfDay(SEED_NOW, 0) + 5 * MINUTE;
  return toLocalIso(new Date(Math.max(floor, SEED_NOW - minutes * MINUTE)));
}

/**
 * `minutes` into the day that fell `daysAgo` days ago — the export's own clock
 * times survive while the calendar day rides the device clock. Calendar-day
 * stepping, not hour subtraction, which drifts with the time of day.
 */
function seedAt(daysAgo: number, minutes: number): string {
  const t = Math.min(startOfDay(SEED_NOW, -daysAgo) + minutes * MINUTE, SEED_NOW);
  return toLocalIso(new Date(t));
}

/**
 * Resolves a deep-link target against the module that actually owns the record,
 * and **throws when it is missing**. The export's own `rel` ids are invented
 * (`#MT-4821`, `#FX-2093`, `#POI-318`) and only two of them exist here; a
 * notification pointing at an unresolvable id would deep-link the user straight
 * into an error screen. Failing at module load instead is the whole point.
 *
 * `reference` and `title` come off the record, never off a literal, so the copy
 * below and the screen the tap opens can never drift apart.
 */
function targetFor<T extends {id: string; reference: string}>(
  recordType: NotificationRecordType,
  records: readonly T[],
  id: string,
  titleOf: (record: T) => string,
): NotificationTarget {
  const record = records.find(r => r.id === id);
  if (!record) {
    throw new Error(
      `Notification seed points at a missing ${recordType} record: ${id}`,
    );
  }
  return {
    recordType,
    recordId: record.id,
    reference: record.reference,
    title: titleOf(record),
  };
}

const MAINTENANCE_ASSIGNED = targetFor(
  'Maintenance',
  MOCK_MAINTENANCE_REQUESTS,
  'mt_40877',
  r => r.type,
);
const MAINTENANCE_MOVED = targetFor(
  'Maintenance',
  MOCK_MAINTENANCE_REQUESTS,
  'mt_40790',
  r => r.type,
);
const INCIDENT_SYNCED = targetFor(
  'Incident',
  MOCK_INCIDENTS,
  'inc_42984',
  r => r.type,
);
const INCIDENT_ESCALATED = targetFor(
  'Incident',
  MOCK_INCIDENTS,
  'inc_42860',
  r => r.type,
);
const FIXTURE_COMMENTED = targetFor(
  'Fixture',
  MOCK_FIXTURES,
  'fx_42984',
  r => r.title,
);
const FIXTURE_APPROVED = targetFor(
  'Fixture',
  MOCK_FIXTURES,
  'fx_42960',
  r => r.title,
);
const POI_INTERACTION = targetFor('Poi', MOCK_POIS, 'poi_rivera', r => r.name);
const WORK_LOG_SAVED = targetFor(
  'WorkLog',
  MOCK_WORK_LOG_ENTRIES,
  'wl_76231651',
  r => r.entryType,
);

/**
 * The export's twelve records: titles, module mix, ordering, icons and tone
 * kept verbatim. Only the embedded record identifiers move, because the
 * export's are invented — see `targetFor`.
 *
 * Four carry `related: null` and are therefore not tappable through to
 * anything: the two System notices have no record at all, and Equipment has no
 * detail screen in this build.
 */
export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'ntf_1',
    module: 'Maintenance',
    title: 'New assignment',
    message:
      `Supervisor assigned **Maintenance ${MAINTENANCE_ASSIGNED.reference}** — ` +
      `${MAINTENANCE_ASSIGNED.title} — to you.`,
    icon: null,
    createdAt: minutesAgo(8),
    unread: true,
    related: MAINTENANCE_ASSIGNED,
  },
  {
    id: 'ntf_2',
    module: 'Incident',
    title: 'Report synced',
    message:
      `Your incident report **${INCIDENT_SYNCED.reference}** — ` +
      `${INCIDENT_SYNCED.title} — finished uploading.`,
    icon: 'Sync',
    createdAt: minutesAgo(24),
    unread: true,
    related: INCIDENT_SYNCED,
  },
  {
    id: 'ntf_3',
    module: 'Cleaning',
    title: 'Work saved',
    message:
      `**Cleaning · ${WORK_LOG_SAVED.title} ${WORK_LOG_SAVED.reference}** was ` +
      'saved to your Work Log.',
    icon: null,
    createdAt: minutesAgo(60),
    unread: true,
    related: WORK_LOG_SAVED,
  },
  {
    id: 'ntf_4',
    module: 'Equipment',
    title: 'Checkout approved',
    message: 'Your checkout of **Utility Cart #4340** was approved.',
    icon: null,
    createdAt: minutesAgo(140),
    unread: false,
    related: null,
  },
  {
    id: 'ntf_5',
    module: 'Fixture',
    title: 'New comment',
    message:
      `**Marcus Bell** commented on **Fixture ${FIXTURE_COMMENTED.reference}** — ` +
      `${FIXTURE_COMMENTED.title}.`,
    icon: 'Comment',
    createdAt: minutesAgo(200),
    unread: false,
    related: FIXTURE_COMMENTED,
  },
  {
    id: 'ntf_6',
    module: 'Maintenance',
    title: 'Status updated',
    message:
      `**Maintenance ${MAINTENANCE_MOVED.reference}** — ${MAINTENANCE_MOVED.title} — ` +
      'moved to In Progress.',
    icon: null,
    createdAt: seedAt(1, 16 * 60 + 12),
    unread: false,
    related: MAINTENANCE_MOVED,
  },
  {
    id: 'ntf_7',
    module: 'POI',
    title: 'Interaction logged',
    message:
      'Your interaction record was saved and linked to ' +
      `**${POI_INTERACTION.title}** (${POI_INTERACTION.reference}).`,
    icon: null,
    createdAt: seedAt(1, 13 * 60 + 26),
    unread: false,
    related: POI_INTERACTION,
  },
  {
    id: 'ntf_8',
    module: 'System',
    title: 'Offline items synced',
    message: '**3 queued records** uploaded successfully when you reconnected.',
    icon: 'Sync',
    createdAt: seedAt(1, 11 * 60 + 2),
    unread: false,
    related: null,
  },
  {
    id: 'ntf_9',
    module: 'Incident',
    title: 'Escalated to supervisor',
    message:
      `**Incident ${INCIDENT_ESCALATED.reference}** — ${INCIDENT_ESCALATED.title} — ` +
      'was escalated for review.',
    icon: null,
    createdAt: seedAt(3, 14 * 60 + 45),
    unread: false,
    related: INCIDENT_ESCALATED,
  },
  {
    id: 'ntf_10',
    module: 'Fixture',
    title: 'Fixture approved',
    message:
      `**Fixture ${FIXTURE_APPROVED.reference}** — ${FIXTURE_APPROVED.title} — ` +
      'was approved by your supervisor.',
    icon: null,
    createdAt: seedAt(4, 9 * 60 + 18),
    unread: false,
    related: FIXTURE_APPROVED,
  },
  {
    id: 'ntf_11',
    module: 'System',
    title: 'Shift summary',
    message:
      'Your shift on Saturday totaled **7h 42m**. Nice work keeping the ' +
      'district running.',
    icon: 'Clock',
    createdAt: seedAt(5, 18 * 60),
    unread: false,
    related: null,
  },
  {
    id: 'ntf_12',
    module: 'Equipment',
    title: 'Check-in reminder',
    message:
      '**Radio #RA-118** has been checked out for 3 days — remember to check ' +
      'it back in.',
    icon: 'Bell',
    createdAt: seedAt(6, 8 * 60),
    unread: false,
    related: null,
  },
];

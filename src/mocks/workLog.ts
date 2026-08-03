import {ENTRY_TYPES, WorkLogEntry} from '../types/workLog';
import {MOCK_SHIFT_TYPES} from './shiftTypes';
import {ZONES} from '../graphql/features/shared/options';

/** This module's own business list, ported verbatim from the source mockup —
 *  distinct from Maintenance's BUSINESS_NAMES, which this field doesn't share. */
export const BUSINESS_NAMES = [
  '16th Street Mall',
  'Union Station',
  'Denver Pavilions',
  'Larimer Square',
];

const LOGGERS = ['You', 'Marcus Bell', 'Sara Diaz', 'Ava Nguyen'];

const YES_NO: readonly ('yes' | 'no')[] = ['yes', 'no'];

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

const HOUR = 60 * 60 * 1000;
/** Anchored to "today" at build time — keep this current so no Date Range
 *  bucket in the Work tab ever reads as empty (the stale-mock-dates trap). */
const GEN_BASE = new Date('2026-08-03T16:00:00').getTime();

/** Ids count down from a base clear of every other mock module's id space. */
const BASE_ID = 76231707;

/**
 * 3 records per shift type (18 total), so every one of the six MOCK_SHIFT_TYPES
 * has real Work Log entries to show in the Work tab out of the box. The source
 * export contains only a single example record reused across every frame, so
 * there is nothing mockup-pinned to port verbatim the way Fixture/Maintenance's
 * explicit records are — this is a deterministic generated seed instead.
 */
export const MOCK_WORK_LOG_ENTRIES: WorkLogEntry[] = MOCK_SHIFT_TYPES.flatMap(
  (shiftType, shiftIndex) =>
    Array.from({length: 3}, (_, i) => {
      const index = shiftIndex * 3 + i;
      const idNum = BASE_ID - index * 7;
      return {
        id: `wl_${idNum}`,
        reference: `#${idNum}`,
        shiftTypeId: shiftType.id,
        shiftTypeName: shiftType.name,
        entryType: ENTRY_TYPES[index % ENTRY_TYPES.length],
        machineNo: String(84726193 - index * 11),
        requestDateTime: toLocalIso(
          new Date(GEN_BASE - index * 13 * HOUR),
        ),
        fvmAccessibilityChecked: YES_NO[index % 2],
        bridgePlateSecured: YES_NO[(index + 1) % 2],
        accessibleFareGateWorking: YES_NO[index % 2],
        automaticDoorWorking: YES_NO[(index + 1) % 2],
        fvmNotWorking: YES_NO[index % 2],
        address: 'Rue Des Hauteurs, Val-David, Quebec J0T 2N0, Canada',
        // The third record of every shift type leaves Zone/Business unset, so
        // the detail screen's "N/A" fallback rendering is actually reachable
        // in the running app rather than only in theory.
        zone: i === 2 ? null : ZONES[index % ZONES.length],
        describeLocation:
          i === 0 ? 'North entrance, beside ticket vending machine' : '',
        businessName: i === 2 ? null : BUSINESS_NAMES[index % BUSINESS_NAMES.length],
        quantity: pad((index % 4) + 1),
        loggedBy: LOGGERS[index % LOGGERS.length],
        createdAt: toLocalIso(new Date(GEN_BASE - index * 13 * HOUR)),
      };
    }),
);

import {
  entryTypesForShift,
  isDetailedFormShift,
  WorkLogEntry,
} from '../types/workLog';
import {MOCK_SHIFT_TYPES} from './shiftTypes';
import {BUSINESS_NAMES, ZONES} from '../graphql/features/shared/options';

const LOGGERS = ['You', 'Marcus Bell', 'Sara Diaz', 'Ava Nguyen'];

const YES_NO: readonly ('yes' | 'no')[] = ['yes', 'no'];

/** Cycled for the generic-shape shifts' Description field. */
const DESCRIPTIONS = [
  'Logged during routine patrol — no follow-up needed.',
  'Reported by a visitor on site; resolved before end of shift.',
  'Routine check, nothing to flag.',
];

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
 *
 * Each shift cycles through its own entryTypesForShift() list (index `i`,
 * 0-2, not the global record index — Outreach's 2-item list would otherwise
 * go out of range) and is shaped per isDetailedFormShift(): Cleaning and
 * Management get the Machine No + 5 FVM Yes/No fields, every other shift
 * gets a Description instead.
 */
export const MOCK_WORK_LOG_ENTRIES: WorkLogEntry[] = MOCK_SHIFT_TYPES.flatMap(
  (shiftType, shiftIndex) => {
    const entryTypes = entryTypesForShift(shiftType.id);
    const detailed = isDetailedFormShift(shiftType.id);
    return Array.from({length: 3}, (_, i) => {
      const index = shiftIndex * 3 + i;
      const idNum = BASE_ID - index * 7;
      const base: WorkLogEntry = {
        id: `wl_${idNum}`,
        reference: `#${idNum}`,
        shiftTypeId: shiftType.id,
        shiftTypeName: shiftType.name,
        entryType: entryTypes[i % entryTypes.length],
        requestDateTime: toLocalIso(new Date(GEN_BASE - index * 13 * HOUR)),
        address: 'Rue Des Hauteurs, Val-David, Quebec J0T 2N0, Canada',
        // The third record of every shift type leaves Zone/Business unset, so
        // the detail screen's "N/A" fallback rendering is actually reachable
        // in the running app rather than only in theory.
        zone: i === 2 ? null : ZONES[index % ZONES.length],
        describeLocation:
          i === 0 ? 'North entrance, beside ticket vending machine' : '',
        businessName:
          i === 2 ? null : BUSINESS_NAMES[index % BUSINESS_NAMES.length],
        quantity: pad((index % 4) + 1),
        loggedBy: LOGGERS[index % LOGGERS.length],
        createdAt: toLocalIso(new Date(GEN_BASE - index * 13 * HOUR)),
      };
      if (detailed) {
        return {
          ...base,
          machineNo: String(84726193 - index * 11),
          fvmAccessibilityChecked: YES_NO[index % 2],
          bridgePlateSecured: YES_NO[(index + 1) % 2],
          accessibleFareGateWorking: YES_NO[index % 2],
          automaticDoorWorking: YES_NO[(index + 1) % 2],
          fvmNotWorking: YES_NO[index % 2],
        };
      }
      return {
        ...base,
        description: DESCRIPTIONS[i % DESCRIPTIONS.length],
      };
    });
  },
);

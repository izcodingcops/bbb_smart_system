/**
 * The date-range filter, shared by Work, Maintenance and Fixture. Each module
 * keeps its own filter fields and options; only the range encoding and matching
 * live here, because all three had byte-identical copies of them.
 */

export const CUSTOM_RANGE_VALUE = 'custom';

export const DATE_RANGE_OPTIONS = [
  {value: 'today', label: 'Today'},
  {value: 'yesterday', label: 'Yesterday'},
  {value: 'last7', label: 'Last 7 days'},
  {value: 'last30', label: 'Last 30 days'},
  {value: 'thisMonth', label: 'This month'},
  {value: CUSTOM_RANGE_VALUE, label: 'Custom range…'},
];

/**
 * A chosen custom range rides inside the same `string[]` as every other filter,
 * encoded as `custom:2026-07-01:2026-07-05`. That keeps `Filters` a plain
 * Record and spares every call site an extra parameter.
 */
export function encodeCustomRange(from: string, to: string): string {
  return `${CUSTOM_RANGE_VALUE}:${from}:${to}`;
}

export function parseCustomRange(
  value: string,
): {from: string; to: string} | null {
  const parts = value.split(':');
  if (parts.length !== 3 || parts[0] !== CUSTOM_RANGE_VALUE) {
    return null;
  }
  return {from: parts[1], to: parts[2]};
}

/** Midnight today, in the device's own timezone. */
function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * Takes the record's date rather than the record, so each module passes its own
 * field — `createdAt`, `requestedAt` or `date`.
 */
export function matchesDateRange(isoDate: string, value: string): boolean {
  const at = new Date(isoDate);
  const custom = parseCustomRange(value);
  if (custom) {
    const from = new Date(`${custom.from}T00:00:00`);
    const to = new Date(`${custom.to}T23:59:59`);
    return at >= from && at <= to;
  }

  const today = startOfToday();
  const dayMs = 24 * 60 * 60 * 1000;
  switch (value) {
    case 'today':
      return at >= today;
    case 'yesterday':
      return at >= new Date(today.getTime() - dayMs) && at < today;
    case 'last7':
      return at >= new Date(today.getTime() - 7 * dayMs);
    case 'last30':
      return at >= new Date(today.getTime() - 30 * dayMs);
    case 'thisMonth':
      return (
        at.getFullYear() === today.getFullYear() &&
        at.getMonth() === today.getMonth()
      );
    // A bare 'custom' with no dates picked yet matches everything.
    default:
      return true;
  }
}

/** 'Jul 1' — short form used inside a custom-range chip. */
function shortDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Turns a stored dateRange value into what the chip and sheet should show. */
export function formatDateRangeValue(value: string): string {
  const custom = parseCustomRange(value);
  if (custom) {
    return `${shortDate(custom.from)} – ${shortDate(custom.to)}`;
  }
  return DATE_RANGE_OPTIONS.find(option => option.value === value)?.label ?? value;
}

import {Fixture} from '../../types/fixture';

export type SortKey = 'latest' | 'oldest' | 'az' | 'za';
export type FilterField = 'fixtureType' | 'zone' | 'status' | 'dateRange';
export type Filters = Record<FilterField, string[]>;

export const EMPTY_FILTERS: Filters = {
  fixtureType: [],
  zone: [],
  status: [],
  dateRange: [],
};

/** The design's chip order. */
export const FILTER_FIELDS: FilterField[] = ['fixtureType', 'zone', 'status', 'dateRange'];

export const FIELD_LABEL: Record<FilterField, string> = {
  fixtureType: 'Type',
  zone: 'Zone',
  status: 'Status',
  dateRange: 'Date Range',
};

export const SORT_OPTIONS: {value: SortKey; label: string}[] = [
  {value: 'latest', label: 'Latest first'},
  {value: 'oldest', label: 'Oldest first'},
  {value: 'az', label: 'Title A → Z'},
  {value: 'za', label: 'Title Z → A'},
];

/** Short form shown on the right of the summary line. */
export const SORT_LABEL: Record<SortKey, string> = {
  latest: 'Latest',
  oldest: 'Oldest',
  az: 'A → Z',
  za: 'Z → A',
};

/**
 * The status sheet offers a third option that isn't a status at all — it
 * matches records flagged `queuedOffline`. Kept as a sentinel so the rest of
 * the filter code can stay a plain string comparison.
 */
export const QUEUED_OFFLINE_VALUE = '__queued_offline__';

export const CUSTOM_RANGE_VALUE = 'custom';

const STATUS_OPTIONS = [
  {value: 'Active', label: 'Active'},
  {value: 'Inactive', label: 'Inactive'},
  {value: QUEUED_OFFLINE_VALUE, label: 'Queued (offline)'},
];

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
 * encoded as `custom:2026-07-01:2026-07-05`.
 */
export function encodeCustomRange(from: string, to: string): string {
  return `${CUSTOM_RANGE_VALUE}:${from}:${to}`;
}

export function parseCustomRange(value: string): {from: string; to: string} | null {
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

function matchesDateRange(fixture: Fixture, value: string): boolean {
  const at = new Date(fixture.createdAt);
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
    default:
      return true;
  }
}

/**
 * Type and Zone come from the loaded records so they stay correct as data
 * changes; Status and Date Range use fixed lists so an option never
 * disappears just because nothing currently has that value.
 */
export function optionsForField(
  fixtures: Fixture[],
  field: FilterField,
): {value: string; label: string}[] {
  if (field === 'status') {
    return STATUS_OPTIONS;
  }
  if (field === 'dateRange') {
    return DATE_RANGE_OPTIONS;
  }
  const key = field === 'fixtureType' ? 'fixtureType' : 'zone';
  const values = Array.from(new Set(fixtures.map(f => f[key]))).sort();
  return values.map(value => ({value, label: value}));
}

function matchesField(fixture: Fixture, field: FilterField, selected: string[]): boolean {
  if (selected.length === 0) {
    return true;
  }
  if (field === 'status') {
    return selected.some(value =>
      value === QUEUED_OFFLINE_VALUE ? fixture.queuedOffline : fixture.status === value,
    );
  }
  if (field === 'dateRange') {
    return selected.some(value => matchesDateRange(fixture, value));
  }
  if (field === 'fixtureType') {
    return selected.includes(fixture.fixtureType);
  }
  return selected.includes(fixture.zone);
}

/** AND across fields, OR within a field. */
export function applyFilters(fixtures: Fixture[], filters: Filters): Fixture[] {
  return fixtures.filter(fixture =>
    (Object.keys(filters) as FilterField[]).every(field =>
      matchesField(fixture, field, filters[field]),
    ),
  );
}

/** Matches id and title only, same convention as Maintenance and Work. */
export function applySearch(fixtures: Fixture[], search: string): Fixture[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return fixtures;
  }
  return fixtures.filter(
    fixture =>
      fixture.id.toLowerCase().includes(query) ||
      fixture.title.toLowerCase().includes(query),
  );
}

export function applySort(fixtures: Fixture[], sort: SortKey): Fixture[] {
  const sorted = [...fixtures];
  switch (sort) {
    case 'latest':
      return sorted.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    case 'oldest':
      return sorted.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    case 'az':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'za':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
  }
}

export function hasAnyFilter(filters: Filters): boolean {
  return (Object.keys(filters) as FilterField[]).some(field => filters[field].length > 0);
}

/** 'Jul 1' — short form used inside a custom-range chip. */
function shortDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Turns a stored filter value into what the chip and sheet should show. */
export function formatFilterValue(field: FilterField, value: string): string {
  if (value === QUEUED_OFFLINE_VALUE) {
    return 'Queued (offline)';
  }
  if (field === 'dateRange') {
    const custom = parseCustomRange(value);
    if (custom) {
      return `${shortDate(custom.from)} – ${shortDate(custom.to)}`;
    }
    return DATE_RANGE_OPTIONS.find(option => option.value === value)?.label ?? value;
  }
  return value;
}

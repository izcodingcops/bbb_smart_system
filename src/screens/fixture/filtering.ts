import {Fixture, FixtureFormOptions} from '../../types/fixture';
import {
  DATE_RANGE_OPTIONS,
  formatDateRangeValue,
  matchesDateRange,
} from '../../utils/dateRange';

export type SortKey = 'latest' | 'oldest' | 'az' | 'za';
export type FilterField = 'fixtureType' | 'zone' | 'status' | 'dateRange';
export type Filters = Record<FilterField, string[]>;

/** Forces a compile error if `FilterField` ever grows a member `optionsForField` doesn't handle. */
function assertNever(value: never): never {
  throw new Error(`Unhandled field: ${value}`);
}

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

const STATUS_OPTIONS = [
  {value: 'Active', label: 'Active'},
  {value: 'Inactive', label: 'Inactive'},
  {value: QUEUED_OFFLINE_VALUE, label: 'Queued (offline)'},
];

/**
 * Type and Zone read from formOptions (the same source as the Create form);
 * Status and Date Range use fixed lists so an option never disappears just
 * because nothing currently has that value.
 */
export function optionsForField(
  _fixtures: Fixture[],
  field: FilterField,
  formOptions: FixtureFormOptions | null,
): {value: string; label: string}[] {
  if (field === 'status') {
    return STATUS_OPTIONS;
  }
  if (field === 'dateRange') {
    return DATE_RANGE_OPTIONS;
  }
  if (field === 'fixtureType') {
    return (formOptions?.fixtureTypes ?? []).map(value => ({value, label: value}));
  }
  if (field === 'zone') {
    return (formOptions?.zones ?? []).map(value => ({value, label: value}));
  }
  return assertNever(field);
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
    return selected.some(value => matchesDateRange(fixture.createdAt, value));
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

/** Matches reference and title only, same convention as Maintenance and Work. */
export function applySearch(fixtures: Fixture[], search: string): Fixture[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return fixtures;
  }
  return fixtures.filter(
    fixture =>
      fixture.reference.toLowerCase().includes(query) ||
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

/** Turns a stored filter value into what the chip and sheet should show. */
export function formatFilterValue(field: FilterField, value: string): string {
  if (value === QUEUED_OFFLINE_VALUE) {
    return 'Queued (offline)';
  }
  if (field === 'dateRange') {
    return formatDateRangeValue(value);
  }
  return value;
}

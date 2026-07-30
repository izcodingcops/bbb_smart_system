import {Dispatch} from '../../types/dispatch';
import {
  DATE_RANGE_OPTIONS,
  formatDateRangeValue,
  matchesDateRange,
} from '../../utils/dateRange';

export type SortKey = 'latest' | 'oldest' | 'az' | 'za';
export type FilterField = 'status' | 'priority' | 'howReferred' | 'dateRange';
export type Filters = Record<FilterField, string[]>;

export const EMPTY_FILTERS: Filters = {
  status: [],
  priority: [],
  howReferred: [],
  dateRange: [],
};

/** The design's chip order. */
export const FILTER_FIELDS: FilterField[] = [
  'status',
  'priority',
  'howReferred',
  'dateRange',
];

export const FIELD_LABEL: Record<FilterField, string> = {
  status: 'Status',
  priority: 'Priority',
  howReferred: 'Referral Source',
  dateRange: 'Date Range',
};

export const SORT_OPTIONS: {value: SortKey; label: string}[] = [
  {value: 'latest', label: 'Latest first'},
  {value: 'oldest', label: 'Oldest first'},
  {value: 'az', label: 'Case No A → Z'},
  {value: 'za', label: 'Case No Z → A'},
];

/** Short form shown on the right of the summary line. */
export const SORT_LABEL: Record<SortKey, string> = {
  latest: 'Latest',
  oldest: 'Oldest',
  az: 'A → Z',
  za: 'Z → A',
};

const STATUS_OPTIONS = [
  {value: 'Open', label: 'Open'},
  {value: 'Escalated', label: 'Escalated'},
  {value: 'Closed', label: 'Closed'},
];

const PRIORITY_OPTIONS = [
  {value: 'Low', label: 'Low'},
  {value: 'Medium', label: 'Medium'},
  {value: 'High', label: 'High'},
];

/**
 * Referral Source comes from the loaded records so it stays correct as data
 * changes; Status, Priority and Date Range use fixed lists so an option never
 * disappears just because nothing currently has that value.
 */
export function optionsForField(
  dispatches: Dispatch[],
  field: FilterField,
): {value: string; label: string}[] {
  if (field === 'status') {
    return STATUS_OPTIONS;
  }
  if (field === 'priority') {
    return PRIORITY_OPTIONS;
  }
  if (field === 'dateRange') {
    return DATE_RANGE_OPTIONS;
  }
  const values = Array.from(new Set(dispatches.map(d => d.howReferred))).sort();
  return values.map(value => ({value, label: value}));
}

function matchesField(
  dispatch: Dispatch,
  field: FilterField,
  selected: string[],
): boolean {
  if (selected.length === 0) {
    return true;
  }
  if (field === 'dateRange') {
    return selected.some(value => matchesDateRange(dispatch.createdAt, value));
  }
  if (field === 'status') {
    return selected.includes(dispatch.status);
  }
  if (field === 'priority') {
    return selected.includes(dispatch.priority);
  }
  return selected.includes(dispatch.howReferred);
}

/** AND across fields, OR within a field. */
export function applyFilters(dispatches: Dispatch[], filters: Filters): Dispatch[] {
  return dispatches.filter(dispatch =>
    (Object.keys(filters) as FilterField[]).every(field =>
      matchesField(dispatch, field, filters[field]),
    ),
  );
}

/**
 * Case number first, then the fields the design's own search matches. Status
 * is deliberately excluded even though the mockup matches it: it is one of the
 * filter chips right above the box, and matching it in free text too makes
 * typing 'open' silently behave like a filter.
 */
export function applySearch(dispatches: Dispatch[], search: string): Dispatch[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return dispatches;
  }
  return dispatches.filter(
    dispatch =>
      dispatch.reference.toLowerCase().includes(query) ||
      dispatch.typeOfActivity.toLowerCase().includes(query) ||
      dispatch.howReferred.toLowerCase().includes(query) ||
      dispatch.address.toLowerCase().includes(query),
  );
}

export function applySort(dispatches: Dispatch[], sort: SortKey): Dispatch[] {
  const sorted = [...dispatches];
  switch (sort) {
    case 'latest':
      return sorted.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    case 'oldest':
      return sorted.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    case 'az':
      return sorted.sort((a, b) => a.reference.localeCompare(b.reference));
    case 'za':
      return sorted.sort((a, b) => b.reference.localeCompare(a.reference));
  }
}

export function hasAnyFilter(filters: Filters): boolean {
  return (Object.keys(filters) as FilterField[]).some(
    field => filters[field].length > 0,
  );
}

/** Turns a stored filter value into what the chip and sheet should show. */
export function formatFilterValue(field: FilterField, value: string): string {
  if (field === 'dateRange') {
    return formatDateRangeValue(value);
  }
  return value;
}

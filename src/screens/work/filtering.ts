import {WorkBucket, WorkItem} from '../../types/work';
import {
  DATE_RANGE_OPTIONS,
  formatDateRangeValue,
  matchesDateRange,
} from '../../utils/dateRange';

export type SortKey = 'latest' | 'oldest' | 'type-asc' | 'type-desc';
export type FilterField =
  | 'category'
  | 'type'
  | 'status'
  | 'priority'
  | 'assignee'
  | 'zone'
  | 'dateRange';
export type Filters = Record<FilterField, string[]>;

export const EMPTY_FILTERS: Filters = {
  category: [],
  type: [],
  status: [],
  priority: [],
  assignee: [],
  zone: [],
  dateRange: [],
};

/** The design's chip order. */
export const FILTER_FIELDS: FilterField[] = [
  'category',
  'type',
  'status',
  'priority',
  'assignee',
  'zone',
  'dateRange',
];

export const FIELD_LABEL: Record<FilterField, string> = {
  category: 'Module',
  type: 'Type',
  status: 'Status',
  priority: 'Priority',
  assignee: 'Assigned By',
  zone: 'Zone',
  dateRange: 'Date Range',
};

export const SORT_OPTIONS: {value: SortKey; label: string}[] = [
  {value: 'latest', label: 'Latest first'},
  {value: 'oldest', label: 'Oldest first'},
  {value: 'type-asc', label: 'Title A → Z'},
  {value: 'type-desc', label: 'Title Z → A'},
];

/** Short form shown on the right of the summary line. */
export const SORT_LABEL: Record<SortKey, string> = {
  latest: 'Latest',
  oldest: 'Oldest',
  'type-asc': 'Title A → Z',
  'type-desc': 'Title Z → A',
};

const CATEGORY_OPTIONS = [
  {value: 'Activity', label: 'Activity'},
  {value: 'Maintenance', label: 'Maintenance'},
  {value: 'Fixture', label: 'Fixture'},
  {value: 'Incident', label: 'Incident'},
  {value: 'POI', label: 'POI'},
];

const STATUS_OPTIONS = [
  {value: 'Open', label: 'Open'},
  {value: 'In-progress', label: 'In-progress'},
  {value: 'Completed', label: 'Completed'},
];

const PRIORITY_OPTIONS = [
  {value: 'High', label: 'High'},
  {value: 'Medium', label: 'Medium'},
  {value: 'Low', label: 'Low'},
];

/**
 * Type, Assigned By and Zone come from the loaded records so they stay correct
 * as data changes; Module, Status, Priority and Date Range use fixed lists so
 * an option never disappears just because nothing currently has that value.
 */
export function optionsForField(
  items: WorkItem[],
  field: FilterField,
): {value: string; label: string}[] {
  if (field === 'category') {
    return CATEGORY_OPTIONS;
  }
  if (field === 'status') {
    return STATUS_OPTIONS;
  }
  if (field === 'priority') {
    return PRIORITY_OPTIONS;
  }
  if (field === 'dateRange') {
    return DATE_RANGE_OPTIONS;
  }
  if (field === 'assignee') {
    const names = Array.from(new Set(items.map(i => i.assignee))).sort();
    return names.map(value => ({value, label: value}));
  }
  if (field === 'zone') {
    const zones = Array.from(new Set(items.map(i => i.zone))).sort();
    return zones.map(value => ({value, label: value}));
  }
  const values = Array.from(new Set(items.map(i => i.type))).sort();
  return values.map(value => ({value, label: value}));
}

function matchesField(
  item: WorkItem,
  field: FilterField,
  selected: string[],
): boolean {
  if (selected.length === 0) {
    return true;
  }
  if (field === 'dateRange') {
    return selected.some(value => matchesDateRange(item.date, value));
  }
  if (field === 'category') {
    return selected.includes(item.category);
  }
  if (field === 'assignee') {
    return selected.includes(item.assignee);
  }
  return selected.includes(item[field]);
}

/** AND across fields, OR within a field. */
export function applyFilters(items: WorkItem[], filters: Filters): WorkItem[] {
  return items.filter(item =>
    (Object.keys(filters) as FilterField[]).every(field =>
      matchesField(item, field, filters[field]),
    ),
  );
}

export function applyBucket(items: WorkItem[], bucket: WorkBucket): WorkItem[] {
  return items.filter(item => item.bucket === bucket);
}

/** Matches reference and type only, same convention as the Maintenance list. */
export function applySearch(items: WorkItem[], search: string): WorkItem[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return items;
  }
  return items.filter(
    item =>
      item.reference.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query),
  );
}

export function applySort(items: WorkItem[], sort: SortKey): WorkItem[] {
  const sorted = [...items];
  switch (sort) {
    case 'latest':
      return sorted.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    case 'oldest':
      return sorted.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    case 'type-asc':
      return sorted.sort((a, b) => a.type.localeCompare(b.type));
    case 'type-desc':
      return sorted.sort((a, b) => b.type.localeCompare(a.type));
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

import {WorkBucket, WorkItem} from '../../types/work';

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

export const CUSTOM_RANGE_VALUE = 'custom';

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

function matchesDateRange(item: WorkItem, value: string): boolean {
  const at = new Date(item.date);
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
    return selected.some(value => matchesDateRange(item, value));
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

/** Matches id and type only, same convention as the Maintenance list. */
export function applySearch(items: WorkItem[], search: string): WorkItem[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return items;
  }
  return items.filter(
    item =>
      item.id.toLowerCase().includes(query) ||
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

/** 'Jul 1' — short form used inside a custom-range chip. */
function shortDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Turns a stored filter value into what the chip and sheet should show. */
export function formatFilterValue(field: FilterField, value: string): string {
  if (field === 'dateRange') {
    const custom = parseCustomRange(value);
    if (custom) {
      return `${shortDate(custom.from)} – ${shortDate(custom.to)}`;
    }
    return (
      DATE_RANGE_OPTIONS.find(option => option.value === value)?.label ?? value
    );
  }
  return value;
}

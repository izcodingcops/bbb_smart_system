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
  | 'sentBy'
  | 'businessName'
  | 'location'
  | 'zone'
  | 'dateRange';
export type Filters = Record<FilterField, string[]>;

export const EMPTY_FILTERS: Filters = {
  category: [],
  type: [],
  status: [],
  priority: [],
  assignee: [],
  sentBy: [],
  businessName: [],
  location: [],
  zone: [],
  dateRange: [],
};

export const FIELD_LABEL: Record<FilterField, string> = {
  category: 'Module',
  type: 'Type',
  status: 'Status',
  priority: 'Priority',
  assignee: 'Assigned By',
  sentBy: 'Sent By',
  businessName: 'Business Name',
  location: 'Location',
  zone: 'Zone',
  dateRange: 'Date Range',
};

/**
 * Which chips each bucket shows, in the design's own order — no longer one
 * static list with 'category' conditionally dropped. Completed has no
 * Status chip (every record there is terminally Completed) and no Assigned
 * By; Assigned has Assigned By but no Business Name; Unassigned has neither
 * Module (Maintenance-only, nothing to choose between) nor Assigned By —
 * its person-shaped chip is Sent By instead, matching createdBy rather than
 * an assignee that doesn't exist yet on an unassigned record.
 */
export const FILTER_FIELDS_BY_BUCKET: Record<WorkBucket, FilterField[]> = {
  assigned: ['category', 'type', 'status', 'priority', 'assignee', 'dateRange', 'zone', 'location'],
  unassigned: ['type', 'priority', 'sentBy', 'zone', 'dateRange', 'location'],
  completed: ['category', 'type', 'priority', 'businessName', 'location', 'zone', 'dateRange'],
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

export const CATEGORY_OPTIONS = [
  {value: 'Activity', label: 'Activity'},
  {value: 'Maintenance', label: 'Maintenance'},
  {value: 'Fixture', label: 'Fixture'},
  {value: 'Incident', label: 'Incident'},
  {value: 'POI', label: 'POI'},
];

/** Assigned only ever mixes these two categories — see `applyBucketScope`. */
export const ASSIGNED_CATEGORY_OPTIONS = [
  {value: 'Maintenance', label: 'Maintenance'},
  {value: 'Activity', label: 'Activity'},
];

/** Assigned defaults to Maintenance (matches the tab's old Maintenance-only
 *  behavior); Completed defaults to Activity, per design. Unassigned never
 *  shows the chip, so it has no default. */
export function defaultCategoryFilter(bucket: WorkBucket): string[] {
  if (bucket === 'assigned') {
    return ['Maintenance'];
  }
  if (bucket === 'completed') {
    return ['Activity'];
  }
  return [];
}

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

/** Fixed, illustrative options — no per-record "neighborhood" concept exists
 *  anywhere in this app yet. Same cosmetic-chip convention this app already
 *  uses for Date Range elsewhere (see .claude/rules/data-module-conventions.md). */
const LOCATION_OPTIONS = [
  {value: 'Downtown Denver', label: 'Downtown Denver'},
  {value: 'LoDo', label: 'LoDo'},
  {value: 'RiNo', label: 'RiNo'},
  {value: 'Capitol Hill', label: 'Capitol Hill'},
  {value: 'Five Points', label: 'Five Points'},
];

/**
 * Type, Assigned By, Sent By, Business Name and Zone come from the loaded
 * records so they stay correct as data changes; Module, Status, Priority,
 * Location and Date Range use fixed lists so an option never disappears
 * just because nothing currently has that value.
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
  if (field === 'location') {
    return LOCATION_OPTIONS;
  }
  if (field === 'dateRange') {
    return DATE_RANGE_OPTIONS;
  }
  if (field === 'assignee') {
    const names = Array.from(new Set(items.map(i => i.assignee))).sort();
    return names.map(value => ({value, label: value}));
  }
  if (field === 'sentBy') {
    const names = Array.from(
      new Set(items.map(i => i.createdBy).filter((v): v is string => !!v)),
    ).sort();
    return names.map(value => ({value, label: value}));
  }
  if (field === 'businessName') {
    const names = Array.from(
      new Set(items.map(i => i.businessName).filter((v): v is string => !!v)),
    ).sort();
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
  if (field === 'sentBy') {
    return !!item.createdBy && selected.includes(item.createdBy);
  }
  if (field === 'businessName') {
    return !!item.businessName && selected.includes(item.businessName);
  }
  if (field === 'location') {
    // Cosmetic — no per-record location data exists in this app yet, same
    // convention as this module's own Date Range chip used to be before it
    // gained real filtering.
    return true;
  }
  return selected.includes(item[field]);
}

/**
 * AND across fields, OR within a field. `fields` scopes which filter keys
 * actually apply — `WorkScreen`'s `filters` state carries a value for every
 * possible `FilterField` even when the current bucket doesn't show a chip
 * for it (e.g. a Status pick made on Assigned stays in state after
 * switching to Completed, which has no Status chip). Without this scoping,
 * that stale value would silently keep filtering a bucket it was never
 * shown on — pass `FILTER_FIELDS_BY_BUCKET[bucket]` from the call site.
 */
export function applyFilters(
  items: WorkItem[],
  filters: Filters,
  fields: FilterField[],
): WorkItem[] {
  return items.filter(item =>
    fields.every(field => matchesField(item, field, filters[field])),
  );
}

export function applyBucket(items: WorkItem[], bucket: WorkBucket): WorkItem[] {
  return items.filter(item => item.bucket === bucket);
}

/**
 * Activity (Work Log) entries have no assigned/unassigned concept of their
 * own — every one is written with `bucket: 'completed'` (see
 * `mocks/workItems.ts`'s `toWorkLogWorkItem`). So "Maintenance assigned to
 * me" and "Activity I've logged" are pulled from two different signals: the
 * item's real `bucket` for Maintenance, unconditionally for Activity.
 */
function maintenanceOrActivity(
  items: WorkItem[],
  maintenanceBucket: WorkBucket,
): WorkItem[] {
  return items.filter(
    item =>
      (item.bucket === maintenanceBucket && item.category === 'Maintenance') ||
      item.category === 'Activity',
  );
}

/**
 * Work tab's own scope per bucket: Unassigned is Maintenance-only (unchanged).
 * Assigned mixes in Activity, narrowed to one category at a time by the
 * Module filter. Completed keeps aggregating every category — the Module
 * filter there is single-select but still offers all of them.
 */
export function applyBucketScope(items: WorkItem[], bucket: WorkBucket): WorkItem[] {
  if (bucket === 'unassigned') {
    return items.filter(
      item => item.bucket === 'unassigned' && item.category === 'Maintenance',
    );
  }
  if (bucket === 'assigned') {
    return maintenanceOrActivity(items, 'assigned');
  }
  return applyBucket(items, 'completed');
}

/**
 * Home's Recent Work preview is narrower than the Work tab: Completed there
 * only ever surfaces Maintenance and Activity too (Fixture/Incident/POI stay
 * Work-tab-only), and there's no Module filter to pick between them — both
 * show mixed, sorted by recency, capped to two.
 */
export function applyHomeScope(items: WorkItem[], bucket: WorkBucket): WorkItem[] {
  if (bucket === 'unassigned') {
    return items.filter(
      item => item.bucket === 'unassigned' && item.category === 'Maintenance',
    );
  }
  return maintenanceOrActivity(items, bucket === 'assigned' ? 'assigned' : 'completed');
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

export function hasAnyFilter(filters: Filters, fields: FilterField[]): boolean {
  return fields.some(field => filters[field].length > 0);
}

/** Turns a stored filter value into what the chip and sheet should show. */
export function formatFilterValue(field: FilterField, value: string): string {
  if (field === 'dateRange') {
    return formatDateRangeValue(value);
  }
  return value;
}

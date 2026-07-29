import {MaintenanceRequest} from '../../types/maintenance';

export type SortKey = 'latest' | 'oldest' | 'type-asc' | 'type-desc';
export type FilterField =
  | 'type'
  | 'businessName'
  | 'priority'
  | 'status'
  | 'dateRange'
  | 'completedBy'
  | 'assignedTo';
export type Filters = Record<FilterField, string[]>;

export const EMPTY_FILTERS: Filters = {
  type: [],
  businessName: [],
  priority: [],
  status: [],
  dateRange: [],
  completedBy: [],
  assignedTo: [],
};

export const SORT_OPTIONS: {value: SortKey; label: string}[] = [
  {value: 'latest', label: 'Latest first'},
  {value: 'oldest', label: 'Oldest first'},
  {value: 'type-asc', label: 'Type A → Z'},
  {value: 'type-desc', label: 'Type Z → A'},
];

/** Short form shown on the right of the summary line. */
export const SORT_LABEL: Record<SortKey, string> = {
  latest: 'Latest',
  oldest: 'Oldest',
  'type-asc': 'Type A → Z',
  'type-desc': 'Type Z → A',
};

/**
 * The status sheet offers a fourth option that isn't a status at all — it
 * matches records flagged `queuedOffline`. Kept as a sentinel so the rest of
 * the filter code can stay a plain string comparison.
 */
export const QUEUED_OFFLINE_VALUE = '__queued_offline__';

/** Same trick for "Assigned To → Unassigned", which is `assignee === null`. */
export const UNASSIGNED_VALUE = '__unassigned__';

export const CUSTOM_RANGE_VALUE = 'custom';

const STATUS_OPTIONS = [
  {value: 'Open', label: 'Open'},
  {value: 'In-progress', label: 'In-progress'},
  {value: 'Completed', label: 'Completed'},
  {value: QUEUED_OFFLINE_VALUE, label: 'Queued (offline)'},
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

function matchesDateRange(request: MaintenanceRequest, value: string): boolean {
  const at = new Date(request.requestedAt);
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
 * Type, Business Name, Completed By and Assigned To come from the loaded
 * records so they stay correct as data changes; Status, Priority and Date Range
 * use fixed lists so an option never disappears just because nothing currently
 * has that value.
 */
export function optionsForField(
  requests: MaintenanceRequest[],
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
  if (field === 'completedBy') {
    const names = Array.from(
      new Set(requests.map(r => r.completedBy).filter((n): n is string => !!n)),
    ).sort();
    return names.map(value => ({value, label: value}));
  }
  if (field === 'assignedTo') {
    const names = Array.from(
      new Set(
        requests.map(r => r.assignee?.name).filter((n): n is string => !!n),
      ),
    ).sort();
    return [
      ...names.map(value => ({value, label: value})),
      {value: UNASSIGNED_VALUE, label: 'Unassigned'},
    ];
  }
  const values = Array.from(new Set(requests.map(r => r[field]))).sort();
  return values.map(value => ({value, label: value}));
}

function matchesField(
  request: MaintenanceRequest,
  field: FilterField,
  selected: string[],
): boolean {
  if (selected.length === 0) {
    return true;
  }
  if (field === 'status') {
    return selected.some(value =>
      value === QUEUED_OFFLINE_VALUE
        ? request.queuedOffline
        : request.status === value,
    );
  }
  if (field === 'dateRange') {
    return selected.some(value => matchesDateRange(request, value));
  }
  if (field === 'completedBy') {
    return !!request.completedBy && selected.includes(request.completedBy);
  }
  if (field === 'assignedTo') {
    return selected.some(value =>
      value === UNASSIGNED_VALUE
        ? !request.assignee
        : request.assignee?.name === value,
    );
  }
  return selected.includes(request[field]);
}

/** AND across fields, OR within a field. */
export function applyFilters(
  requests: MaintenanceRequest[],
  filters: Filters,
): MaintenanceRequest[] {
  return requests.filter(request =>
    (Object.keys(filters) as FilterField[]).every(field =>
      matchesField(request, field, filters[field]),
    ),
  );
}

/**
 * Matches id and type only. The placeholder's "ID or name" means the request's
 * own name — business is reachable through its own chip, and including it here
 * would make one business name return every request at that location.
 */
export function applySearch(
  requests: MaintenanceRequest[],
  search: string,
): MaintenanceRequest[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return requests;
  }
  return requests.filter(
    request =>
      request.id.toLowerCase().includes(query) ||
      request.type.toLowerCase().includes(query),
  );
}

export function applySort(
  requests: MaintenanceRequest[],
  sort: SortKey,
): MaintenanceRequest[] {
  const sorted = [...requests];
  switch (sort) {
    case 'latest':
      return sorted.sort(
        (a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt),
      );
    case 'oldest':
      return sorted.sort(
        (a, b) => Date.parse(a.requestedAt) - Date.parse(b.requestedAt),
      );
    case 'type-asc':
      return sorted.sort((a, b) => a.type.localeCompare(b.type));
    case 'type-desc':
      return sorted.sort((a, b) => b.type.localeCompare(a.type));
  }
}

export function countByStatus(requests: MaintenanceRequest[]): {
  open: number;
  inProgress: number;
} {
  return {
    open: requests.filter(r => r.status === 'Open').length,
    inProgress: requests.filter(r => r.status === 'In-progress').length,
  };
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
  if (value === QUEUED_OFFLINE_VALUE) {
    return 'Queued (offline)';
  }
  if (value === UNASSIGNED_VALUE) {
    return 'Unassigned';
  }
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

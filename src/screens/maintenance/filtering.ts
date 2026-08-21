import {MaintenanceFormOptions, MaintenanceRequest} from '../../types/maintenance';
import {
  DATE_RANGE_OPTIONS,
  formatDateRangeValue,
  matchesDateRange,
} from '../../utils/dateRange';

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

/** Forces a compile error if `FilterField` ever grows a member `optionsForField` doesn't handle. */
function assertNever(value: never): never {
  throw new Error(`Unhandled field: ${value}`);
}

export const EMPTY_FILTERS: Filters = {
  type: [],
  businessName: [],
  priority: [],
  status: [],
  dateRange: [],
  completedBy: [],
  assignedTo: [],
};

/** The design's chip order. */
export const FILTER_FIELDS: FilterField[] = [
  'type',
  'businessName',
  'priority',
  'status',
  'dateRange',
  'completedBy',
  'assignedTo',
];

export const FIELD_LABEL: Record<FilterField, string> = {
  type: 'Type',
  businessName: 'Business Name',
  priority: 'Priority',
  status: 'Status',
  dateRange: 'Date Range',
  completedBy: 'Completed By',
  assignedTo: 'Assigned To',
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

/**
 * Type, Business Name and Assigned To use formOptions (same source as the
 * create form) so both agree and stay correct. Completed By derives from
 * loaded requests — no backend lookup for completed-by exists. Status,
 * Priority and Date Range use fixed lists so options never disappear just
 * because nothing has that value.
 */
export function optionsForField(
  requests: MaintenanceRequest[],
  field: FilterField,
  formOptions: MaintenanceFormOptions | null,
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
  if (field === 'type') {
    return (formOptions?.types ?? []).map(value => ({value, label: value}));
  }
  if (field === 'businessName') {
    return (formOptions?.businessNames ?? []).map(value => ({value, label: value}));
  }
  if (field === 'completedBy') {
    const names = Array.from(
      new Set(requests.map(r => r.completedBy).filter((n): n is string => !!n)),
    ).sort();
    return names.map(value => ({value, label: value}));
  }
  if (field === 'assignedTo') {
    return [
      ...(formOptions?.ambassadors ?? []).map(value => ({value, label: value})),
      {value: UNASSIGNED_VALUE, label: 'Unassigned'},
    ];
  }
  return assertNever(field);
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
    return selected.some(value => matchesDateRange(request.requestedAt, value));
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
 * Matches reference and type only. The placeholder's "ID or name" means the request's
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
      request.reference.toLowerCase().includes(query) ||
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

/** Turns a stored filter value into what the chip and sheet should show. */
export function formatFilterValue(field: FilterField, value: string): string {
  if (value === QUEUED_OFFLINE_VALUE) {
    return 'Queued (offline)';
  }
  if (value === UNASSIGNED_VALUE) {
    return 'Unassigned';
  }
  if (field === 'dateRange') {
    return formatDateRangeValue(value);
  }
  return value;
}

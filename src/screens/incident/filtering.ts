import {Incident, IncidentFormOptions} from '../../types/incident';
import {DATE_RANGE_OPTIONS, formatDateRangeValue, matchesDateRange} from '../../utils/dateRange';

export type SortKey = 'latest' | 'oldest' | 'az' | 'za';
export type FilterField =
  | 'type'
  | 'outcome'
  | 'status'
  | 'assignee'
  | 'priority'
  | 'businessName'
  | 'person'
  | 'dateRange';
export type Filters = Record<FilterField, string[]>;

export const EMPTY_FILTERS: Filters = {
  type: [],
  outcome: [],
  status: [],
  assignee: [],
  priority: [],
  businessName: [],
  person: [],
  dateRange: [],
};

/** The design's chip order. */
export const FILTER_FIELDS: FilterField[] = [
  'type',
  'outcome',
  'status',
  'assignee',
  'priority',
  'businessName',
  'person',
  'dateRange',
];

export const FIELD_LABEL: Record<FilterField, string> = {
  type: 'Type',
  outcome: 'Outcome',
  status: 'Status',
  assignee: 'Ambassador',
  priority: 'Priority',
  businessName: 'Business Name',
  person: 'Person',
  dateRange: 'Date Range',
};

export const SORT_OPTIONS: {value: SortKey; label: string}[] = [
  {value: 'latest', label: 'Latest first'},
  {value: 'oldest', label: 'Oldest first'},
  {value: 'az', label: 'Type A → Z'},
  {value: 'za', label: 'Type Z → A'},
];

export const SORT_LABEL: Record<SortKey, string> = {
  latest: 'Latest',
  oldest: 'Oldest',
  az: 'A → Z',
  za: 'Z → A',
};

/** The status sheet's fourth option matches records flagged `queuedOffline`. */
export const QUEUED_OFFLINE_VALUE = '__queued_offline__';
/** "Ambassador → Unassigned", which is `assignee === null`. */
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
 * Type, Outcome, Business Name come from formOptions (the same
 * incidentFormOptions the create form uses); Person and Ambassador (assignee)
 * still derive from loaded records; Status, Priority and Date Range use fixed
 * lists so an option never disappears just because nothing currently has that
 * value.
 */
export function optionsForField(
  incidents: Incident[],
  field: FilterField,
  formOptions: IncidentFormOptions | null,
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
    return (formOptions?.incidentTypes ?? []).map(value => ({value, label: value}));
  }
  if (field === 'outcome') {
    return (formOptions?.outcomes ?? []).map(value => ({value, label: value}));
  }
  if (field === 'businessName') {
    return (formOptions?.businessNames ?? []).map(value => ({value, label: value}));
  }
  if (field === 'assignee') {
    const names = Array.from(
      new Set(incidents.map(i => i.assignee?.name).filter((n): n is string => !!n)),
    ).sort();
    return [...names.map(name => ({value: name, label: name})), {value: UNASSIGNED_VALUE, label: 'Unassigned'}];
  }
  // 'person' stays derived from loaded records: it's free text typed on the
  // Parties section, not a real lookup — see the sourcing-audit doc.
  const values = Array.from(new Set(incidents.map(i => i[field]))).sort();
  return values.map(value => ({value, label: value}));
}

function matchesField(incident: Incident, field: FilterField, selected: string[]): boolean {
  if (selected.length === 0) {
    return true;
  }
  if (field === 'status') {
    return selected.some(value =>
      value === QUEUED_OFFLINE_VALUE ? incident.queuedOffline : incident.status === value,
    );
  }
  if (field === 'assignee') {
    return selected.some(value =>
      value === UNASSIGNED_VALUE ? !incident.assignee : incident.assignee?.name === value,
    );
  }
  if (field === 'dateRange') {
    return selected.some(value => matchesDateRange(incident.occurredAt, value));
  }
  if (field === 'priority') {
    return selected.includes(incident.priority);
  }
  return selected.includes(incident[field] as string);
}

/** AND across fields, OR within a field. */
export function applyFilters(incidents: Incident[], filters: Filters): Incident[] {
  return incidents.filter(incident =>
    (Object.keys(filters) as FilterField[]).every(field => matchesField(incident, field, filters[field])),
  );
}

/** Matches reference and type only, same convention as Fixture and Maintenance. */
export function applySearch(incidents: Incident[], search: string): Incident[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return incidents;
  }
  return incidents.filter(
    incident =>
      incident.reference.toLowerCase().includes(query) ||
      incident.type.toLowerCase().includes(query),
  );
}

export function applySort(incidents: Incident[], sort: SortKey): Incident[] {
  const sorted = [...incidents];
  switch (sort) {
    case 'latest':
      return sorted.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
    case 'oldest':
      return sorted.sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
    case 'az':
      return sorted.sort((a, b) => a.type.localeCompare(b.type));
    case 'za':
      return sorted.sort((a, b) => b.type.localeCompare(a.type));
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
  if (value === UNASSIGNED_VALUE) {
    return 'Unassigned';
  }
  if (field === 'dateRange') {
    return formatDateRangeValue(value);
  }
  return value;
}

/** Feeds ListSummary's breakdown row: "Total · Open · In Progress". */
export function countByStatus(incidents: Incident[]): {open: number; inProgress: number} {
  return {
    open: incidents.filter(i => i.status === 'Open').length,
    inProgress: incidents.filter(i => i.status === 'In-progress').length,
  };
}

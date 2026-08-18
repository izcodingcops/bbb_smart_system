import {AmbassadorWork} from '../../types/ambassador';

export type SortKey = 'newest' | 'oldest';

export type FilterField = 'reportNumber' | 'dateRange';

export type Filters = Record<FilterField, string[]>;

export const EMPTY_FILTERS: Filters = {reportNumber: [], dateRange: []};

export const FILTER_FIELDS: FilterField[] = ['reportNumber', 'dateRange'];

export const FIELD_LABEL: Record<FilterField, string> = {
  reportNumber: 'Report #',
  dateRange: 'Date Range',
};

/** Date Range is cosmetic — same convention as every other module's chip of the same name. */
export const FUNCTIONAL_FIELDS: FilterField[] = ['reportNumber'];

export const SORT_OPTIONS: {value: SortKey; label: string}[] = [
  {value: 'newest', label: 'Newest'},
  {value: 'oldest', label: 'Oldest'},
];

export const SORT_LABEL: Record<SortKey, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
};

/** Matches any reference that contains what was typed, '#' ignored either side. */
function matchesReportNumber(work: AmbassadorWork, needle: string): boolean {
  const target = work.reference.toLowerCase().replace(/^#/, '');
  const query = needle.toLowerCase().replace(/^#/, '').trim();
  return query.length === 0 || target.includes(query);
}

export function applyFilters(items: AmbassadorWork[], filters: Filters): AmbassadorWork[] {
  const reportNumber = filters.reportNumber[0];
  if (!reportNumber) {
    return items;
  }
  return items.filter(item => matchesReportNumber(item, reportNumber));
}

/** Matches reference, business name, sub-type, type and zone. */
export function applySearch(items: AmbassadorWork[], search: string): AmbassadorWork[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return items;
  }
  return items.filter(item =>
    [item.reference, item.businessName, item.subType, item.type, item.zone].some(s =>
      s.toLowerCase().includes(query),
    ),
  );
}

export function applySort(items: AmbassadorWork[], sort: SortKey): AmbassadorWork[] {
  const sorted = [...items];
  if (sort === 'oldest') {
    return sorted.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  }
  return sorted.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function hasAnyFilter(filters: Filters): boolean {
  return FILTER_FIELDS.some(field => filters[field].length > 0);
}

/** Yes-count-style priority, derived, never stored — matches the handoff's own priLabel. */
export function priorityForPoints(points: number): 'High' | 'Medium' | 'Low' {
  if (points >= 50) {
    return 'High';
  }
  if (points >= 30) {
    return 'Medium';
  }
  return 'Low';
}

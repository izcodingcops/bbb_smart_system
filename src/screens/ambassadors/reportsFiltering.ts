import {ObservationReport} from '../../types/observationReport';
import {DATE_RANGE_OPTIONS, formatDateRangeValue} from '../../utils/dateRange';

export type SortKey = 'latest' | 'scoreHigh' | 'scoreLow';

export type FilterField = 'reviewedBy' | 'score' | 'dateRange';

export type Filters = Record<FilterField, string[]>;

export const EMPTY_FILTERS: Filters = {reviewedBy: [], score: [], dateRange: []};

/**
 * The handoff calls this chip 'Created User', but what it actually filters
 * on (`r.reviewer`) is this app's existing 'Reviewed By' concept from the
 * real Observation Reports module — 'Created User' there is a different,
 * cosmetic field this data model doesn't have. Named for what it does, not
 * the handoff's label, to avoid implying a field that doesn't exist.
 */
export const FILTER_FIELDS: FilterField[] = ['reviewedBy', 'score', 'dateRange'];

export const FIELD_LABEL: Record<FilterField, string> = {
  reviewedBy: 'Reviewed By',
  score: 'Score',
  dateRange: 'Date Range',
};

/** Date Range is cosmetic — same convention as every other module's chip of the same name. */
export const FUNCTIONAL_FIELDS: FilterField[] = ['reviewedBy', 'score'];

/** Radio/single-choice sheets — everything else is a checkbox multi-select. */
export const SINGLE_FIELDS: FilterField[] = ['score', 'dateRange'];

export const SORT_OPTIONS: {value: SortKey; label: string}[] = [
  {value: 'latest', label: 'Latest'},
  {value: 'scoreHigh', label: 'Score: High to Low'},
  {value: 'scoreLow', label: 'Score: Low to High'},
];

export const SORT_LABEL: Record<SortKey, string> = {
  latest: 'Latest',
  scoreHigh: 'Score ↓',
  scoreLow: 'Score ↑',
};

const SCORE_OPTIONS = ['0-2 Score', '2-3 Score', '3-5 Score'];

/**
 * `reviewedBy` has no app-wide picklist (the real Observation Reports module's
 * own list is a static scrape unrelated to any one ambassador) — its options
 * are the reviewers who actually appear among this ambassador's own reports.
 */
export function optionsForField(
  field: FilterField,
  reports: ObservationReport[],
): {value: string; label: string}[] {
  if (field === 'dateRange') {
    return DATE_RANGE_OPTIONS;
  }
  if (field === 'score') {
    return SCORE_OPTIONS.map(value => ({value, label: value}));
  }
  const names = Array.from(new Set(reports.map(r => r.reviewedBy.name))).sort((a, b) =>
    a.localeCompare(b),
  );
  return names.map(value => ({value, label: value}));
}

/**
 * Kept verbatim: a score of exactly 2 or 3 matches only one bucket, not two.
 * Same overlapping-boundary quirk as Observation Reports and RVP.
 */
function matchesScoreBucket(score: number, bucket: string): boolean {
  if (bucket === '0-2 Score') {
    return score >= 0 && score < 2;
  }
  if (bucket === '2-3 Score') {
    return score >= 2 && score < 3;
  }
  if (bucket === '3-5 Score') {
    return score >= 3 && score <= 5;
  }
  return false;
}

function matchesField(
  report: ObservationReport,
  field: FilterField,
  selected: string[],
): boolean {
  if (selected.length === 0) {
    return true;
  }
  if (field === 'reviewedBy') {
    return selected.includes(report.reviewedBy.name);
  }
  if (field === 'score') {
    return selected.some(v => matchesScoreBucket(report.score, v));
  }
  // dateRange: cosmetic, per FUNCTIONAL_FIELDS.
  return true;
}

export function applyFilters(
  items: ObservationReport[],
  filters: Filters,
): ObservationReport[] {
  return items.filter(item =>
    FUNCTIONAL_FIELDS.every(field => matchesField(item, field, filters[field])),
  );
}

export function applySearch(items: ObservationReport[], search: string): ObservationReport[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return items;
  }
  return items.filter(item =>
    [item.reference, item.zone, item.reviewedBy.name].some(s =>
      s.toLowerCase().includes(query),
    ),
  );
}

export function applySort(items: ObservationReport[], sort: SortKey): ObservationReport[] {
  const sorted = [...items];
  if (sort === 'scoreHigh') {
    return sorted.sort(
      (a, b) => b.score - a.score || Date.parse(b.dateTime) - Date.parse(a.dateTime),
    );
  }
  if (sort === 'scoreLow') {
    return sorted.sort(
      (a, b) => a.score - b.score || Date.parse(b.dateTime) - Date.parse(a.dateTime),
    );
  }
  return sorted.sort((a, b) => Date.parse(b.dateTime) - Date.parse(a.dateTime));
}

export function hasAnyFilter(filters: Filters): boolean {
  return FILTER_FIELDS.some(field => filters[field].length > 0);
}

export function formatFilterValue(field: FilterField, value: string): string {
  if (field === 'dateRange') {
    return formatDateRangeValue(value);
  }
  return value;
}

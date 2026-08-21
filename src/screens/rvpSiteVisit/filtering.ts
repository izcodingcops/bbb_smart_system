import {RvpSiteVisit} from '../../types/rvpSiteVisit';
import {RVP_LEADER_POSITIONS, RVP_REVIEWERS} from '../../mocks/rvpSiteVisit';
import {DATE_RANGE_OPTIONS, formatDateRangeValue} from '../../utils/dateRange';

/**
 * Four sorts, not six. The handoff's `computeList` also implements score-high
 * and score-low, and its label map names them — but its sort sheet only ever
 * renders these four, so those branches are unreachable in the design too.
 */
export type SortKey = 'latest' | 'oldest' | 'nameAsc' | 'nameDesc';

export type FilterField =
  | 'program'
  | 'reviewer'
  | 'leaderPosition'
  | 'score'
  | 'dateRange';

export type Filters = Record<FilterField, string[]>;

export const EMPTY_FILTERS: Filters = {
  program: [],
  reviewer: [],
  leaderPosition: [],
  score: [],
  dateRange: [],
};

/** The handoff's own CHIPS order — not regrouped "functional first". */
export const FILTER_FIELDS: FilterField[] = [
  'program',
  'reviewer',
  'leaderPosition',
  'score',
  'dateRange',
];

export const FIELD_LABEL: Record<FilterField, string> = {
  program: 'Program',
  reviewer: 'Reviewer',
  leaderPosition: 'Leader Position',
  score: 'Score',
  dateRange: 'Date Range',
};

/**
 * Date Range is cosmetic: the handoff's own `matchFilter` falls through to
 * `true` for it, so the chip opens, holds a selection and renders, but never
 * narrows the list. Same convention as Observation Reports — check here before
 * treating an unfiltered chip as a bug.
 */
export const FUNCTIONAL_FIELDS: FilterField[] = [
  'program',
  'reviewer',
  'leaderPosition',
  'score',
];

/** Radio/single-choice sheets — everything else is a checkbox multi-select. */
export const SINGLE_FIELDS: FilterField[] = ['score', 'dateRange'];

export const SORT_OPTIONS: {value: SortKey; label: string}[] = [
  {value: 'latest', label: 'Latest'},
  {value: 'oldest', label: 'Oldest'},
  {value: 'nameAsc', label: 'A to Z'},
  {value: 'nameDesc', label: 'Z to A'},
];

export const SORT_LABEL: Record<SortKey, string> = {
  latest: 'Latest',
  oldest: 'Oldest',
  nameAsc: 'A → Z',
  nameDesc: 'Z → A',
};

const SCORE_OPTIONS = ['0-2 Score', '2-3 Score', '3-5 Score'];

/**
 * `'Rizvi , Ahsann'` (the filter list) ⇄ `'Ahsann Rizvi'` (the record).
 *
 * Ported from the handoff's own `flipName`, including that it returns anything
 * without exactly one comma unchanged. The option list keeps the customer's
 * spacing because that is what the sheet displays; this is what bridges it.
 */
export function flipName(value: string): string {
  const parts = value.split(/\s*,\s*/);
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : value;
}

export function optionsForField(
  field: FilterField,
  programs: string[],
): {value: string; label: string}[] {
  if (field === 'dateRange') {
    return DATE_RANGE_OPTIONS;
  }
  const values: string[] = (() => {
    switch (field) {
      case 'program':
        return programs;
      case 'reviewer':
        return RVP_REVIEWERS;
      case 'leaderPosition':
        return RVP_LEADER_POSITIONS;
      case 'score':
        return SCORE_OPTIONS;
    }
  })();
  return values.map(value => ({value, label: value}));
}

/** > 8 options and not a single-select sheet — same rule as the handoff. */
export function isSearchable(field: FilterField, programs: string[]): boolean {
  return optionsForField(field, programs).length > 8 && !SINGLE_FIELDS.includes(field);
}

/**
 * The handoff's overlapping boundaries, kept verbatim: a score of exactly 2 or
 * 3 matches one bucket, not two. Don't "fix" this into even ranges — Observation
 * Reports ships the same quirk.
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
  visit: RvpSiteVisit,
  field: FilterField,
  selected: string[],
): boolean {
  if (selected.length === 0) {
    return true;
  }
  if (field === 'program') {
    return selected.includes(visit.program);
  }
  if (field === 'reviewer') {
    return selected.some(v => flipName(v) === visit.reviewedBy);
  }
  if (field === 'leaderPosition') {
    return selected.includes(visit.leaderPosition);
  }
  if (field === 'score') {
    return selected.some(v => matchesScoreBucket(visit.avgScore, v));
  }
  // dateRange: cosmetic, per FUNCTIONAL_FIELDS.
  return true;
}

export function applyFilters(
  items: RvpSiteVisit[],
  filters: Filters,
): RvpSiteVisit[] {
  return items.filter(item =>
    FUNCTIONAL_FIELDS.every(field => matchesField(item, field, filters[field])),
  );
}

/** Same breadth as the handoff's own matchSearch. */
export function applySearch(
  items: RvpSiteVisit[],
  search: string,
): RvpSiteVisit[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return items;
  }
  return items.filter(item =>
    [
      item.operationManager,
      item.program,
      item.reviewedBy,
      item.updatedBy,
      item.reference,
      item.leaderPosition,
    ].some(s => s.toLowerCase().includes(query)),
  );
}

export function applySort(items: RvpSiteVisit[], sort: SortKey): RvpSiteVisit[] {
  const sorted = [...items];
  switch (sort) {
    case 'oldest':
      return sorted.sort(
        (a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt),
      );
    case 'nameAsc':
      return sorted.sort((a, b) =>
        a.operationManager
          .toLowerCase()
          .localeCompare(b.operationManager.toLowerCase()),
      );
    case 'nameDesc':
      return sorted.sort((a, b) =>
        b.operationManager
          .toLowerCase()
          .localeCompare(a.operationManager.toLowerCase()),
      );
    default:
      return sorted.sort(
        (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
      );
  }
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

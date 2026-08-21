import {ObservationReport, ObservationReportType} from '../../types/observationReport';
import {DATE_RANGE_OPTIONS, formatDateRangeValue} from '../../utils/dateRange';

export type SortKey = 'latest' | 'scoreHigh' | 'scoreLow' | 'nameAsc' | 'nameDesc';

export type FilterField =
  | 'createdUser'
  | 'activeUsers'
  | 'deletedUsers'
  | 'zone'
  | 'score'
  | 'reviewedBy'
  | 'dateRange';

export type Filters = Record<FilterField, string[]>;

export const EMPTY_FILTERS: Filters = {
  createdUser: [],
  activeUsers: [],
  deletedUsers: [],
  zone: [],
  score: [],
  reviewedBy: [],
  dateRange: [],
};

/** Mockup's own CHIPS order — not grouped by "functional first". */
export const FILTER_FIELDS: FilterField[] = [
  'createdUser',
  'activeUsers',
  'deletedUsers',
  'zone',
  'score',
  'reviewedBy',
  'dateRange',
];

export const FIELD_LABEL: Record<FilterField, string> = {
  createdUser: 'Created User',
  activeUsers: 'Active Users',
  deletedUsers: 'Deleted Users',
  zone: 'Zone',
  score: 'Score',
  reviewedBy: 'Reviewed By',
  dateRange: 'Date Range',
};

/**
 * Only these three affect the visible list — the mockup's own `matchFilter`
 * falls through to `true` for the other four (no `createdBy` field distinct
 * from `reviewedBy`, no active/deleted employee-status field on any record).
 * Kept as a pass-through here too: those chips render, open their sheets,
 * and hold a selection, but never narrow `visible`.
 */
export const FUNCTIONAL_FIELDS: FilterField[] = ['zone', 'score', 'reviewedBy'];

/** Radio/single-choice sheets — everything else is a checkbox multi-select. */
export const SINGLE_FIELDS: FilterField[] = ['score', 'dateRange'];

export const SORT_OPTIONS: {value: SortKey; label: string}[] = [
  {value: 'latest', label: 'Latest'},
  {value: 'scoreHigh', label: 'Score: High to Low'},
  {value: 'scoreLow', label: 'Score: Low to High'},
  {value: 'nameAsc', label: 'A to Z'},
  {value: 'nameDesc', label: 'Z to A'},
];

export const SORT_LABEL: Record<SortKey, string> = {
  latest: 'Latest',
  scoreHigh: 'Score ↓',
  scoreLow: 'Score ↑',
  nameAsc: 'A → Z',
  nameDesc: 'Z → A',
};

const SCORE_OPTIONS = ['0-2 Score', '2-3 Score', '3-5 Score'];

const REVIEWED_BY_OPTIONS = [
  'user 99, test', 'user2, test', 'ambassador, test', 'Asim, Muhammad',
  'Barnes, Teeya', 'Coulter, Chris', 'Cox, Tahira', 'dvp, test',
  'Dev 2, Tester', 'Bridget Brownlee', 'Chris Coulter', 'Will Campbell',
  'Tina Durbin', 'Michael Chou', 'Stan Der-by', 'Kendrick Dale',
];

const CREATED_USER_OPTIONS = [
  'ambassador, test', 'Asim, Muhammad', 'Barnes, Teeya', 'Boone Jr., Anthony',
  'Brownlee, Bridget', 'Campbell, Will', 'Chou, Michael', 'Coulter, Chris',
  'Cox, Tahira', 'Dale, Kendrick', 'Der-by, Stan', 'Dev 2, Tester',
  'Durbin, Tina', 'dvp, test',
];

const ACTIVE_USER_OPTIONS = [
  'Adrian Garcia', 'Allie Barker', 'Anthony Boone Jr.', 'Arslan saeed',
  'Ashley Shultis', 'Asim Tester', 'Bill Montgomery', 'Bridget Brownlee',
  'Cam Hurd', 'Chad Williamson', 'Chico Lockhart', 'Chris Coulter',
  'Clayton Ratledge', 'Clint Tester',
];

const DELETED_USER_OPTIONS = [
  'Aaron Perri (Deleted) 02/23/2024', 'Adrian Garcia (Deleted) 12/13/2024',
  'Andre Sanders (Deleted) 08/18/2024', 'Andrew Dobson (Deleted) 01/01/2025',
  'Angela Grether (Deleted) 12/13/2024', 'Ashley Jackson (Deleted) 09/11/2024',
  'Asim Tester (Deleted) 05/04/2026', 'BBB Tester (Deleted) 01/07/2025',
];

export function optionsForField(field: FilterField, zones: string[]): {value: string; label: string}[] {
  if (field === 'dateRange') {
    return DATE_RANGE_OPTIONS;
  }
  const values: string[] = (() => {
    switch (field) {
      case 'zone': return zones;
      case 'score': return SCORE_OPTIONS;
      case 'reviewedBy': return REVIEWED_BY_OPTIONS;
      case 'createdUser': return CREATED_USER_OPTIONS;
      case 'activeUsers': return ACTIVE_USER_OPTIONS;
      case 'deletedUsers': return DELETED_USER_OPTIONS;
    }
  })();
  return values.map(value => ({value, label: value}));
}

/** > 8 options and not a single-select sheet — same rule as the mockup. */
export function isSearchable(field: FilterField, zones: string[]): boolean {
  return optionsForField(field, zones).length > 8 && !SINGLE_FIELDS.includes(field);
}

function matchesScoreBucket(score: number, bucket: string): boolean {
  if (bucket === '0-2 Score') return score >= 0 && score < 2;
  if (bucket === '2-3 Score') return score >= 2 && score < 3;
  if (bucket === '3-5 Score') return score >= 3 && score <= 5;
  return false;
}

function matchesField(report: ObservationReport, field: FilterField, selected: string[]): boolean {
  if (selected.length === 0) return true;
  if (field === 'zone') return selected.includes(report.zone);
  if (field === 'reviewedBy') return selected.includes(report.reviewedBy.name);
  if (field === 'score') return selected.some(v => matchesScoreBucket(report.score, v));
  // createdUser / activeUsers / deletedUsers / dateRange: cosmetic, per FUNCTIONAL_FIELDS.
  return true;
}

export function applyFilters(items: ObservationReport[], filters: Filters): ObservationReport[] {
  return items.filter(item =>
    FUNCTIONAL_FIELDS.every(field => matchesField(item, field, filters[field])),
  );
}

export function applyBucket(items: ObservationReport[], tab: ObservationReportType): ObservationReport[] {
  return items.filter(item => item.type === tab);
}

/** Matches name, reference, zone, reviewer and type — same breadth as the mockup's matchSearch. */
export function applySearch(items: ObservationReport[], search: string): ObservationReport[] {
  const query = search.trim().toLowerCase();
  if (!query) return items;
  return items.filter(item =>
    [item.name, item.reference, item.zone, item.reviewedBy.name, item.type]
      .some(s => s.toLowerCase().includes(query)),
  );
}

export function applySort(items: ObservationReport[], sort: SortKey): ObservationReport[] {
  const sorted = [...items];
  switch (sort) {
    case 'scoreHigh':
      return sorted.sort((a, b) => b.score - a.score || Date.parse(b.dateTime) - Date.parse(a.dateTime));
    case 'scoreLow':
      return sorted.sort((a, b) => a.score - b.score || Date.parse(b.dateTime) - Date.parse(a.dateTime));
    case 'nameAsc':
      return sorted.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    case 'nameDesc':
      return sorted.sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()));
    default:
      return sorted.sort((a, b) => Date.parse(b.dateTime) - Date.parse(a.dateTime));
  }
}

export function hasAnyFilter(filters: Filters): boolean {
  return FILTER_FIELDS.some(field => filters[field].length > 0);
}

export function formatFilterValue(field: FilterField, value: string): string {
  if (field === 'dateRange') return formatDateRangeValue(value);
  return value;
}

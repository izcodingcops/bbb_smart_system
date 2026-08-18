import {Ambassador, AmbassadorStatus} from '../../types/ambassador';
import {DATE_RANGE_OPTIONS, formatDateRangeValue} from '../../utils/dateRange';

export type SortKey = 'newest' | 'oldest' | 'nameAsc' | 'nameDesc' | 'pointsHigh';

export type FilterField =
  | 'jobTitle'
  | 'pointsEarned'
  | 'status'
  | 'badges'
  | 'lastActiveDate';

export type Filters = Record<FilterField, string[]>;

export const EMPTY_FILTERS: Filters = {
  jobTitle: [],
  pointsEarned: [],
  status: [],
  badges: [],
  lastActiveDate: [],
};

/** The handoff's own CHIPS order. */
export const FILTER_FIELDS: FilterField[] = [
  'jobTitle',
  'pointsEarned',
  'status',
  'badges',
  'lastActiveDate',
];

export const FIELD_LABEL: Record<FilterField, string> = {
  jobTitle: 'Job Title',
  pointsEarned: 'Points Earned',
  status: 'Status',
  badges: 'Badges',
  lastActiveDate: 'Last Active Date',
};

/**
 * Last Active Date is cosmetic: the handoff's own `matchFilter` falls
 * through to `true` for it, same convention as every other module's Date
 * Range chip — it renders, opens and holds a selection but never narrows
 * the list.
 */
export const FUNCTIONAL_FIELDS: FilterField[] = [
  'jobTitle',
  'pointsEarned',
  'status',
  'badges',
];

/** Radio/single-choice sheets — everything else is a checkbox multi-select. */
export const SINGLE_FIELDS: FilterField[] = ['pointsEarned', 'lastActiveDate'];

export const SORT_OPTIONS: {value: SortKey; label: string}[] = [
  {value: 'newest', label: 'Newest'},
  {value: 'oldest', label: 'Oldest'},
  {value: 'nameAsc', label: 'Name A → Z'},
  {value: 'nameDesc', label: 'Name Z → A'},
  {value: 'pointsHigh', label: 'Points: High to Low'},
];

export const SORT_LABEL: Record<SortKey, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  nameAsc: 'A → Z',
  nameDesc: 'Z → A',
  pointsHigh: 'Points ↓',
};

const JOB_TITLES = [
  'Ambassador',
  'Administrative Assistant',
  'Custom Title',
  'Hospitality Ambassador',
  'Supervisor',
  'Team Lead',
];

const POINTS_OPTIONS = ['0 pts', '1 – 500 pts', '501 – 1,500 pts', '1,501+ pts'];

const BADGE_OPTIONS = [
  '100 Shifts',
  '250 Shifts',
  '500 Shifts',
  'Mentor',
  'Perfect Uniform',
  'Public Favorite',
  'Safety Star',
  'Top Cleaner',
  'Zero Incidents',
];

const STATUS_OPTIONS: AmbassadorStatus[] = ['Active', 'In-active', 'Suspended'];

export function optionsForField(field: FilterField): {value: string; label: string}[] {
  if (field === 'lastActiveDate') {
    return DATE_RANGE_OPTIONS;
  }
  const values: string[] = (() => {
    switch (field) {
      case 'jobTitle':
        return JOB_TITLES;
      case 'pointsEarned':
        return POINTS_OPTIONS;
      case 'status':
        return STATUS_OPTIONS;
      case 'badges':
        return BADGE_OPTIONS;
    }
  })();
  return values.map(value => ({value, label: value}));
}

/** > 8 options and not a single-select sheet — same rule as every other module. */
export function isSearchable(field: FilterField): boolean {
  return optionsForField(field).length > 8 && !SINGLE_FIELDS.includes(field);
}

function matchesPointsBucket(points: number, bucket: string): boolean {
  if (bucket === '0 pts') {
    return points === 0;
  }
  if (bucket === '1 – 500 pts') {
    return points > 0 && points <= 500;
  }
  if (bucket === '501 – 1,500 pts') {
    return points > 500 && points <= 1500;
  }
  return points > 1500;
}

function matchesField(
  ambassador: Ambassador,
  field: FilterField,
  selected: string[],
): boolean {
  if (selected.length === 0) {
    return true;
  }
  if (field === 'jobTitle') {
    return selected.includes(ambassador.jobTitle);
  }
  if (field === 'status') {
    return selected.includes(ambassador.status);
  }
  if (field === 'badges') {
    return selected.some(v => ambassador.badges.includes(v));
  }
  if (field === 'pointsEarned') {
    return selected.some(v => matchesPointsBucket(ambassador.points, v));
  }
  // lastActiveDate: cosmetic, per FUNCTIONAL_FIELDS.
  return true;
}

export function applyFilters(items: Ambassador[], filters: Filters): Ambassador[] {
  return items.filter(item =>
    FUNCTIONAL_FIELDS.every(field => matchesField(item, field, filters[field])),
  );
}

/** Matches name, username, reference and job title — same breadth as the handoff's matchSearch. */
export function applySearch(items: Ambassador[], search: string): Ambassador[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return items;
  }
  return items.filter(item =>
    [item.name, item.username, item.reference, item.jobTitle].some(s =>
      s.toLowerCase().includes(query),
    ),
  );
}

export function applySort(items: Ambassador[], sort: SortKey): Ambassador[] {
  const sorted = [...items];
  switch (sort) {
    case 'oldest':
      return sorted.sort(
        (a, b) => Date.parse(a.lastLoggedIn) - Date.parse(b.lastLoggedIn),
      );
    case 'nameAsc':
      return sorted.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    case 'nameDesc':
      return sorted.sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()));
    case 'pointsHigh':
      return sorted.sort((a, b) => b.points - a.points);
    default:
      return sorted.sort(
        (a, b) => Date.parse(b.lastLoggedIn) - Date.parse(a.lastLoggedIn),
      );
  }
}

export function hasAnyFilter(filters: Filters): boolean {
  return FILTER_FIELDS.some(field => filters[field].length > 0);
}

export function formatFilterValue(field: FilterField, value: string): string {
  if (field === 'lastActiveDate') {
    return formatDateRangeValue(value);
  }
  return value;
}

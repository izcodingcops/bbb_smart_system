import {
  Poi,
  PoiDisposition,
  PoiFormOptions,
  PoiInteractionFormOptions,
} from '../../types/poi';
import {
  DATE_RANGE_OPTIONS,
  formatDateRangeValue,
  matchesDateRange,
} from '../../utils/dateRange';

export type SortKey = 'latest' | 'oldest' | 'az' | 'za';
export type FilterField =
  | 'person'
  | 'personType'
  | 'disposition'
  | 'interactionCount'
  | 'zone'
  | 'createdBy'
  | 'dateRange';
export type Filters = Record<FilterField, string[]>;

export const EMPTY_FILTERS: Filters = {
  person: [],
  personType: [],
  disposition: [],
  interactionCount: [],
  zone: [],
  createdBy: [],
  dateRange: [],
};

/** The design's chip order. */
export const FILTER_FIELDS: FilterField[] = [
  'person',
  'personType',
  'disposition',
  'interactionCount',
  'zone',
  'createdBy',
  'dateRange',
];

export const FIELD_LABEL: Record<FilterField, string> = {
  person: 'Person',
  personType: 'Type',
  disposition: 'Disposition',
  interactionCount: 'Interaction Count',
  zone: 'Zone',
  createdBy: 'Created / Modified',
  dateRange: 'Date Range',
};

export const SORT_OPTIONS: {value: SortKey; label: string}[] = [
  {value: 'latest', label: 'Latest first'},
  {value: 'oldest', label: 'Oldest first'},
  {value: 'az', label: 'Name A → Z'},
  {value: 'za', label: 'Name Z → A'},
];

/** Short form shown on the right of the summary line. */
export const SORT_LABEL: Record<SortKey, string> = {
  latest: 'Latest',
  oldest: 'Oldest',
  az: 'A → Z',
  za: 'Z → A',
};

/**
 * The disposition palette, from the design's own `dispClass()`. Defined once
 * here rather than in both the card and the detail view — two copies of a
 * six-entry colour table is how they drift.
 */
export const DISPOSITION_STYLE: Record<
  PoiDisposition,
  {bg: string; fg: string}
> = {
  Active: {bg: '#DCFCE7', fg: '#16A34A'},
  Housed: {bg: '#DBEAFE', fg: '#2563EB'},
  'In-active': {bg: '#F1F3F5', fg: '#475467'},
  'Transitional Care': {bg: '#FEF3C7', fg: '#B45309'},
  Incarcerated: {bg: '#EDE9FE', fg: '#7C3AED'},
  Deceased: {bg: '#FEE2E2', fg: '#DC2626'},
};

/**
 * Interaction counts filter by band, not by exact number. The boundaries live
 * here so the filter and the chip label can't disagree about where 'moderate'
 * starts.
 */
export const INTERACTION_BUCKETS = [
  {value: 'low', label: '1–3 (low)'},
  {value: 'moderate', label: '4–8 (moderate)'},
  {value: 'frequent', label: '9+ (frequent)'},
];

export function interactionBucket(count: number): string {
  if (count <= 3) {
    return 'low';
  }
  return count <= 8 ? 'moderate' : 'frequent';
}

const DISPOSITION_OPTIONS = (
  Object.keys(DISPOSITION_STYLE) as PoiDisposition[]
)
  .slice()
  .sort()
  .map(value => ({value, label: value}));

/**
 * Person and Zone come from poiInteractionFormOptions (the Create Person form
 * never asks for either, so poiFormOptions carries neither); Type/personType
 * comes from poiFormOptions. Disposition, Interaction Count and Date Range use
 * fixed lists so an option never disappears just because nothing currently
 * has that value. Created/Modified still derives from loaded pois — no
 * per-record distinction between created-by and last-modified-by exists yet.
 */
export function optionsForField(
  pois: Poi[],
  field: FilterField,
  formOptions: PoiFormOptions | null,
  interactionFormOptions: PoiInteractionFormOptions | null,
): {value: string; label: string}[] {
  if (field === 'disposition') {
    return DISPOSITION_OPTIONS;
  }
  if (field === 'interactionCount') {
    return INTERACTION_BUCKETS;
  }
  if (field === 'dateRange') {
    return DATE_RANGE_OPTIONS;
  }
  if (field === 'person') {
    const names = Array.from(
      new Set((interactionFormOptions?.people ?? []).map(p => p.name)),
    );
    return names.map(value => ({value, label: value}));
  }
  if (field === 'personType') {
    return (formOptions?.personTypes ?? []).map(value => ({value, label: value}));
  }
  if (field === 'zone') {
    return (interactionFormOptions?.zones ?? []).map(value => ({value, label: value}));
  }
  const names = Array.from(new Set(pois.map(poi => poi.createdBy.name))).sort();
  return names.map(value => ({value, label: value}));
}

function matchesField(
  poi: Poi,
  field: FilterField,
  selected: string[],
): boolean {
  if (selected.length === 0) {
    return true;
  }
  switch (field) {
    case 'person':
      return selected.includes(poi.name);
    case 'personType':
      return selected.includes(poi.personType);
    case 'disposition':
      return selected.includes(poi.disposition);
    case 'interactionCount':
      return selected.includes(interactionBucket(poi.interactionCount));
    case 'zone':
      return selected.includes(poi.zone);
    case 'createdBy':
      return selected.includes(poi.createdBy.name);
    case 'dateRange':
      return selected.some(value =>
        matchesDateRange(poi.lastModifiedAt, value),
      );
  }
}

/** AND across fields, OR within a field. */
export function applyFilters(pois: Poi[], filters: Filters): Poi[] {
  return pois.filter(poi =>
    (Object.keys(filters) as FilterField[]).every(field =>
      matchesField(poi, field, filters[field]),
    ),
  );
}

/** Reference, name, type, disposition and zone — the design's own matchSearch. */
export function applySearch(pois: Poi[], search: string): Poi[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return pois;
  }
  return pois.filter(poi =>
    [poi.reference, poi.name, poi.personType, poi.disposition, poi.zone].some(
      value => value.toLowerCase().includes(query),
    ),
  );
}

export function applySort(pois: Poi[], sort: SortKey): Poi[] {
  const sorted = [...pois];
  switch (sort) {
    case 'latest':
      return sorted.sort(
        (a, b) => Date.parse(b.lastModifiedAt) - Date.parse(a.lastModifiedAt),
      );
    case 'oldest':
      return sorted.sort(
        (a, b) => Date.parse(a.lastModifiedAt) - Date.parse(b.lastModifiedAt),
      );
    case 'az':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'za':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
  }
}

export function hasAnyFilter(filters: Filters): boolean {
  return (Object.keys(filters) as FilterField[]).some(
    field => filters[field].length > 0,
  );
}

/** Turns a stored filter value into what the chip and sheet should show. */
export function formatFilterValue(field: FilterField, value: string): string {
  if (field === 'interactionCount') {
    return (
      INTERACTION_BUCKETS.find(bucket => bucket.value === value)?.label ?? value
    );
  }
  if (field === 'dateRange') {
    return formatDateRangeValue(value);
  }
  return value;
}

import {ReferenceDocument, ReferenceDocumentFilterOptions} from '../../types/referenceDocument';
import {DATE_RANGE_OPTIONS, formatDateRangeValue} from '../../utils/dateRange';

export type SortKey = 'latest' | 'oldest' | 'az' | 'za';

export type FilterField = 'entryType' | 'business' | 'zone' | 'dateRange';

export type Filters = Record<FilterField, string[]>;

export const EMPTY_FILTERS: Filters = {
  entryType: [],
  business: [],
  zone: [],
  dateRange: [],
};

/** Mockup's own CHIPS order. */
export const FILTER_FIELDS: FilterField[] = ['entryType', 'business', 'zone', 'dateRange'];

export const FIELD_LABEL: Record<FilterField, string> = {
  entryType: 'Entry Type',
  business: 'Business Name',
  zone: 'Zone',
  dateRange: 'Date Range',
};

/**
 * Only these three affect the visible list — the mockup's own `matchFilter`
 * falls through to `true` for Date Range ("pass-through in mock"). Kept as a
 * pass-through here too, same convention as Observation Reports.
 */
export const FUNCTIONAL_FIELDS: FilterField[] = ['entryType', 'business', 'zone'];

/** Radio/single-choice sheets — everything else is a checkbox multi-select. */
export const SINGLE_FIELDS: FilterField[] = ['dateRange'];

export const SORT_OPTIONS: {value: SortKey; label: string}[] = [
  {value: 'latest', label: 'Latest first'},
  {value: 'oldest', label: 'Oldest first'},
  {value: 'az', label: 'Entry Type A → Z'},
  {value: 'za', label: 'Entry Type Z → A'},
];

export const SORT_LABEL: Record<SortKey, string> = {
  latest: 'Latest',
  oldest: 'Oldest',
  az: 'A → Z',
  za: 'Z → A',
};

export function optionsForField(
  field: FilterField,
  options: ReferenceDocumentFilterOptions | null,
): {value: string; label: string}[] {
  if (field === 'dateRange') {
    return DATE_RANGE_OPTIONS;
  }
  const values: string[] = (() => {
    switch (field) {
      case 'entryType': return options?.entryTypes ?? [];
      case 'business': return options?.businesses ?? [];
      case 'zone': return options?.zones ?? [];
    }
  })();
  return values.map(value => ({value, label: value}));
}

/** > 8 options and not a single-select sheet — same rule as Observation Reports. */
export function isSearchable(
  field: FilterField,
  options: ReferenceDocumentFilterOptions | null,
): boolean {
  return optionsForField(field, options).length > 8 && !SINGLE_FIELDS.includes(field);
}

function matchesField(doc: ReferenceDocument, field: FilterField, selected: string[]): boolean {
  if (selected.length === 0) return true;
  if (field === 'entryType') return selected.includes(doc.entryType);
  if (field === 'business') return selected.includes(doc.business);
  if (field === 'zone') return selected.includes(doc.zone);
  // dateRange: cosmetic, per FUNCTIONAL_FIELDS.
  return true;
}

export function applyFilters(items: ReferenceDocument[], filters: Filters): ReferenceDocument[] {
  return items.filter(item =>
    FUNCTIONAL_FIELDS.every(field => matchesField(item, field, filters[field])),
  );
}

/** Matches reference, entry type, business and zone — same breadth as the mockup's matchSearch. */
export function applySearch(items: ReferenceDocument[], search: string): ReferenceDocument[] {
  const query = search.trim().toLowerCase();
  if (!query) return items;
  return items.filter(item =>
    [item.reference, item.entryType, item.business, item.zone].some(s =>
      s.toLowerCase().includes(query),
    ),
  );
}

export function applySort(items: ReferenceDocument[], sort: SortKey): ReferenceDocument[] {
  const sorted = [...items];
  switch (sort) {
    case 'oldest':
      return sorted.sort((a, b) => Date.parse(a.dateTime) - Date.parse(b.dateTime));
    case 'az':
      return sorted.sort((a, b) => a.entryType.toLowerCase().localeCompare(b.entryType.toLowerCase()));
    case 'za':
      return sorted.sort((a, b) => b.entryType.toLowerCase().localeCompare(a.entryType.toLowerCase()));
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

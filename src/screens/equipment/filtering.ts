import {Equipment, EquipmentFormOptions} from '../../types/equipment';
import {
  DATE_RANGE_OPTIONS,
  formatDateRangeValue,
  matchesDateRange,
} from '../../utils/dateRange';

/**
 * The two tabs share no configuration — the source mockup gives All Equipment
 * four sorts and ten chips, Checked-Out two sorts and five. They are modelled
 * as two parallel sets rather than one state with a tab discriminator, because
 * every option list genuinely differs. The transforms below are shared, since
 * `MineFilterField` is a subset of `AllFilterField` and `MineSortKey` of
 * `AllSortKey`.
 */

export type AllSortKey = 'newest' | 'oldest' | 'az' | 'za';
export type MineSortKey = 'newest' | 'oldest';

export type AllFilterField =
  | 'program'
  | 'region'
  | 'division'
  | 'status'
  | 'category'
  | 'equipmentType'
  | 'make'
  | 'model'
  | 'zone'
  | 'dateRange';

export type MineFilterField = Extract<
  AllFilterField,
  'category' | 'equipmentType' | 'make' | 'model' | 'dateRange'
>;

export type AllFilters = Record<AllFilterField, string[]>;
export type MineFilters = Record<MineFilterField, string[]>;

/** The design's chip order, tab by tab. */
export const ALL_FILTER_FIELDS: AllFilterField[] = [
  'program',
  'region',
  'division',
  'status',
  'category',
  'equipmentType',
  'make',
  'model',
  'zone',
  'dateRange',
];

export const MINE_FILTER_FIELDS: MineFilterField[] = [
  'category',
  'equipmentType',
  'make',
  'model',
  'dateRange',
];

export const EMPTY_ALL_FILTERS: AllFilters = {
  program: [],
  region: [],
  division: [],
  status: [],
  category: [],
  equipmentType: [],
  make: [],
  model: [],
  zone: [],
  dateRange: [],
};

export const EMPTY_MINE_FILTERS: MineFilters = {
  category: [],
  equipmentType: [],
  make: [],
  model: [],
  dateRange: [],
};

export const FIELD_LABEL: Record<AllFilterField, string> = {
  program: 'Program',
  region: 'Region',
  division: 'Division',
  status: 'Status',
  category: 'Category',
  equipmentType: 'Type',
  make: 'Make',
  model: 'Model',
  zone: 'Zone',
  dateRange: 'Date Range',
};

export const ALL_SORT_OPTIONS: {value: AllSortKey; label: string}[] = [
  {value: 'newest', label: 'Newest first'},
  {value: 'oldest', label: 'Oldest first'},
  {value: 'az', label: 'A to Z'},
  {value: 'za', label: 'Z to A'},
];

export const MINE_SORT_OPTIONS: {value: MineSortKey; label: string}[] = [
  {value: 'newest', label: 'Newest'},
  {value: 'oldest', label: 'Oldest'},
];

/** Short form shown on the right of the summary line. */
export const SORT_LABEL: Record<AllSortKey, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  az: 'A to Z',
  za: 'Z to A',
};

const STATUS_OPTIONS = [
  {value: 'Active', label: 'Active'},
  {value: 'Checked-Out', label: 'Checked-Out'},
];

/** One accessor per filterable field, so the matcher stays a lookup. */
const VALUE_OF: Record<
  Exclude<AllFilterField, 'dateRange'>,
  (e: Equipment) => string
> = {
  program: e => e.program,
  region: e => e.region,
  division: e => e.division,
  status: e => e.status,
  category: e => e.category,
  equipmentType: e => e.equipmentType,
  make: e => e.make,
  model: e => e.model,
  zone: e => e.zone,
};

/**
 * Status and Date Range use fixed lists so an option never disappears just
 * because nothing currently has that value; Region and Division read from
 * formOptions (derived from the store, same as the create form's own
 * picklists); everything else is derived from the loaded records so it stays
 * correct as the pool changes.
 */
export function optionsForField(
  items: Equipment[],
  field: AllFilterField,
  formOptions: EquipmentFormOptions | null,
): {value: string; label: string}[] {
  if (field === 'status') {
    return STATUS_OPTIONS;
  }
  if (field === 'dateRange') {
    return DATE_RANGE_OPTIONS;
  }
  if (field === 'region') {
    return (formOptions?.regions ?? []).map(value => ({value, label: value}));
  }
  if (field === 'division') {
    return (formOptions?.divisions ?? []).map(value => ({value, label: value}));
  }
  const read = VALUE_OF[field];
  // Blanks are dropped rather than offered as an unlabelled row. Zone is
  // optional on the create form and stores as '' when unset, and '' sorts
  // first — so an empty row would sit at the top of the sheet.
  const values = Array.from(new Set(items.map(read).filter(Boolean))).sort();
  return values.map(value => ({value, label: value}));
}

function matchesField(
  item: Equipment,
  field: AllFilterField,
  selected: string[],
): boolean {
  if (selected.length === 0) {
    return true;
  }
  if (field === 'dateRange') {
    return selected.some(value => matchesDateRange(item.createdAt, value));
  }
  return selected.includes(VALUE_OF[field](item));
}

/** AND across fields, OR within a field. Serves both tabs' filter shapes. */
export function applyFilters<F extends AllFilterField>(
  items: Equipment[],
  filters: Record<F, string[]>,
): Equipment[] {
  const fields = Object.keys(filters) as F[];
  return items.filter(item =>
    fields.every(field => matchesField(item, field, filters[field])),
  );
}

/**
 * Serial, reference, name, type, category, make and zone — the mockup's own
 * `aMatchSearch`/`mMatchSearch` are identical and wider than this repo's usual
 * reference+title convention. The placeholder ("Search by Serial or Name")
 * understates it in the source design too.
 */
export function applySearch(items: Equipment[], search: string): Equipment[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return items;
  }
  return items.filter(item =>
    [
      item.serial,
      item.reference,
      item.name,
      item.equipmentType,
      item.category,
      item.make,
      item.zone,
    ].some(value => value.toLowerCase().includes(query)),
  );
}

export function applySort(items: Equipment[], sort: AllSortKey): Equipment[] {
  const sorted = [...items];
  switch (sort) {
    case 'newest':
      return sorted.sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );
    case 'oldest':
      return sorted.sort(
        (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
      );
    case 'az':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'za':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
  }
}

export function hasAnyFilter<F extends AllFilterField>(
  filters: Record<F, string[]>,
): boolean {
  return (Object.keys(filters) as F[]).some(
    field => filters[field].length > 0,
  );
}

/** Turns a stored filter value into what the chip and sheet should show. */
export function formatFilterValue(
  field: AllFilterField,
  value: string,
): string {
  return field === 'dateRange' ? formatDateRangeValue(value) : value;
}

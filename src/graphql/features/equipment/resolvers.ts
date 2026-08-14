import {
  EquipmentCategoryOption,
  EquipmentDetail,
  EquipmentOwnership,
  EquipmentUnit,
} from '../../../types/equipment';
import {
  CONNECTED_INCIDENTS,
  CONNECTED_MAINTENANCE,
  CONNECTED_POIS,
  FUEL_OPTIONS,
  TAXONOMY_CATEGORIES,
  TAXONOMY_MAKES,
  TAXONOMY_MODELS,
  TAXONOMY_TYPES,
} from '../../../mocks/equipmentTaxonomy';
import {sleep} from '../../mockSession';
import {
  equipmentStore,
  findByCode,
  findRecord,
  insertRecord,
  nextEquipmentId,
  nextReference,
  removeRecord,
} from './store';

/**
 * The create flow's list, not the hub mockup's — the hub ships real-world test
 * data ('12 Dec', '16 Jan Test Pre') that would look like a bug in the app.
 */
const UPKEEP_TYPES = [
  'Oil Change',
  'Tire Replacement',
  'Battery Service',
  'Body Work',
  'Drive Train Repair',
  'Brake Service',
  'Software Update',
  'Inspection',
  'Cleaning',
  'Other',
];

const ABNORMALITIES = [
  'Scratch / Dent',
  'Mechanical Issue',
  'Missing Part',
  'Screen/Display Damage',
  'Electrical Fault',
  'Fluid Leak',
  'Other',
];

/** Counter for upkeep ids; the store has no reference sequence for them. */
let upkeepSeq = 0;

function mustFind(id: string) {
  const record = findRecord(id);
  if (!record) {
    throw new Error(`Unknown equipment: ${id}`);
  }
  return record;
}

const STATUS_OUT = {
  Active: 'ACTIVE',
  'Checked-Out': 'CHECKED_OUT',
} as const;

const OWNERSHIP_OUT = {
  Owned: 'OWNED',
  Leased: 'LEASED',
  Rented: 'RENTED',
  Loaned: 'LOANED',
} as const;

const UNIT_OUT = {
  Miles: 'MILES',
  Hours: 'HOURS',
  Kilometers: 'KILOMETERS',
  None: 'NONE',
} as const;

type WireOwnership = 'OWNED' | 'LEASED' | 'RENTED' | 'LOANED';
type WireUnit = 'MILES' | 'HOURS' | 'KILOMETERS' | 'NONE';

// The inbound direction, for the enums arriving on EquipmentInput. Named
// _IN to match observationReport's TYPE_OUT / TYPE_IN convention. Written out
// rather than derived by inverting _OUT so a mistyped member is a compile
// error here instead of an `undefined` written into the store.
const OWNERSHIP_IN: Record<WireOwnership, EquipmentOwnership> = {
  OWNED: 'Owned',
  LEASED: 'Leased',
  RENTED: 'Rented',
  LOANED: 'Loaned',
};

const UNIT_IN: Record<WireUnit, EquipmentUnit> = {
  MILES: 'Miles',
  HOURS: 'Hours',
  KILOMETERS: 'Kilometers',
  NONE: 'None',
};

/** The wire shape of `input EquipmentInput`. */
interface WireEquipmentInput {
  serial: string;
  name: string;
  acquiredAt: string;
  category: string;
  equipmentType: string;
  make: string;
  model: string;
  unit: WireUnit;
  ownership: WireOwnership;
  fuel: string | null;
  year: string | null;
  beginningUsage: string | null;
  zone: string | null;
  description: string | null;
  images: string[] | null;
  incidents: string[] | null;
  personsOfInterest: string[] | null;
  maintenance: string[] | null;
}

/**
 * The mockup's static tree, widened by every combination that actually exists
 * in the store. Without the merge, opening Edit on a seeded record whose
 * category the mockup never listed (e.g. 'Bicycle') would show a value the
 * dropdown cannot represent, and the dependent chain would blank the record's
 * own type/make/model on the first interaction.
 *
 * A record created with a brand-new combination stays editable for the same
 * reason: the tree is rebuilt from the store on every call.
 */
function buildCategoryTree(): EquipmentCategoryOption[] {
  // category → type → make → models. Maps, not plain objects, so insertion is
  // a single lookup per level and the sort at the end is the only ordering.
  const tree = new Map<string, Map<string, Map<string, Set<string>>>>();

  const insert = (
    category: string,
    equipmentType?: string,
    make?: string,
    model?: string,
  ) => {
    if (!category) {
      return;
    }
    let types = tree.get(category);
    if (!types) {
      types = new Map();
      tree.set(category, types);
    }
    if (!equipmentType) {
      return;
    }
    let makes = types.get(equipmentType);
    if (!makes) {
      makes = new Map();
      types.set(equipmentType, makes);
    }
    if (!make) {
      return;
    }
    let models = makes.get(make);
    if (!models) {
      models = new Set();
      makes.set(make, models);
    }
    if (model) {
      models.add(model);
    }
  };

  TAXONOMY_CATEGORIES.forEach(category => {
    insert(category);
    (TAXONOMY_TYPES[category] ?? []).forEach(equipmentType => {
      insert(category, equipmentType);
      (TAXONOMY_MAKES[equipmentType] ?? []).forEach(make => {
        insert(category, equipmentType, make);
        (TAXONOMY_MODELS[make] ?? []).forEach(model => {
          insert(category, equipmentType, make, model);
        });
      });
    });
  });

  equipmentStore.records.forEach(record => {
    insert(record.category, record.equipmentType, record.make, record.model);
  });

  const byName = (a: string, b: string) => a.localeCompare(b);

  // Sorted at every level so the store-derived entries interleave with the
  // static ones instead of trailing them.
  return Array.from(tree.keys())
    .sort(byName)
    .map(category => ({
      name: category,
      types: Array.from(tree.get(category)!.keys())
        .sort(byName)
        .map(equipmentType => ({
          name: equipmentType,
          makes: Array.from(tree.get(category)!.get(equipmentType)!.keys())
            .sort(byName)
            .map(make => ({
              name: make,
              models: Array.from(
                tree.get(category)!.get(equipmentType)!.get(make)!,
              ).sort(byName),
            })),
        })),
    }));
}

/**
 * Wire input → the stored record, shared by create and update so a wrong
 * field mapping cannot differ between the two. Deliberately writes only the
 * fields the form owns: `status`, `mine`, `checkedOutBy`, `checkedOutAt`,
 * `reference`, `createdAt`, `id`, `queuedOffline` and `upkeeps` are custody
 * and identity state, and clobbering `mine` on an edit would silently return
 * a checked-out record to the pool.
 */
function applyInput(record: EquipmentDetail, input: WireEquipmentInput): void {
  record.serial = input.serial;
  record.name = input.name;
  record.acquiredAt = input.acquiredAt;
  record.category = input.category;
  record.equipmentType = input.equipmentType;
  record.make = input.make;
  record.model = input.model;
  record.unit = UNIT_IN[input.unit];
  record.ownership = OWNERSHIP_IN[input.ownership];
  record.fuel = input.fuel ?? null;
  record.year = input.year ?? null;
  record.beginningUsage = input.beginningUsage ?? null;
  // `zone` is non-null on the record but optional on the input — the form's
  // Zone dropdown can be left unset, and '' is what the card already renders
  // for a record with no zone.
  record.zone = input.zone ?? '';
  record.description = input.description ?? null;
  record.images = input.images ?? [];
  record.incidents = input.incidents ?? [];
  record.personsOfInterest = input.personsOfInterest ?? [];
  record.maintenance = input.maintenance ?? [];
}

/** App shape → wire shape. Every enum is uppercased here, nowhere else. */
function toWire(record: EquipmentDetail) {
  return {
    ...record,
    status: STATUS_OUT[record.status],
    ownership: OWNERSHIP_OUT[record.ownership],
    unit: UNIT_OUT[record.unit],
  };
}

/**
 * The detail projection additionally guarantees the list fields are arrays.
 * The SDL declares them non-null, and the store always populates them — but a
 * real gateway will not, and the mapper is the only place that can hold that
 * line cheaply.
 */
function toDetailWire(record: EquipmentDetail) {
  return {
    ...toWire(record),
    images: record.images ?? [],
    // Nested objects need the same enum discipline as the top level. There is
    // no enum on EquipmentUpkeep today; the spread is here so adding one later
    // doesn't quietly ship a lowercase value.
    upkeeps: (record.upkeeps ?? []).map(u => ({...u})),
    incidents: record.incidents ?? [],
    personsOfInterest: record.personsOfInterest ?? [],
    maintenance: record.maintenance ?? [],
  };
}

export const equipmentResolvers = {
  Query: {
    equipment: async () => {
      await sleep();
      return equipmentStore.records.map(toWire);
    },

    myEquipment: async () => {
      await sleep();
      return equipmentStore.records.filter(r => r.mine).map(toWire);
    },

    equipmentDetail: async (_: unknown, {id}: {id: string}) => {
      await sleep();
      const record = findRecord(id);
      return record ? toDetailWire(record) : null;
    },

    equipmentByCode: async (_: unknown, {code}: {code: string}) => {
      await sleep();
      const record = findByCode(code);
      return record ? toWire(record) : null;
    },

    equipmentFormOptions: async () => {
      await sleep();
      return {
        upkeepTypes: UPKEEP_TYPES,
        abnormalities: ABNORMALITIES,
        // Blanks are filtered out: Zone is optional on the create form, and
        // applyInput stores an unset one as '' because Equipment.zone is
        // non-null. Without this, the first record saved without a zone puts
        // an empty, blank-looking row at the top of the Zone dropdown.
        zones: Array.from(
          new Set(equipmentStore.records.map(r => r.zone).filter(Boolean)),
        ).sort(),
        nextReference: nextReference(),
        categories: buildCategoryTree(),
        // Wire values, not display ones: uppercasing lives in the resolver,
        // per the toWire discipline above, and hooks.ts maps them back.
        ownerships: ['OWNED', 'LEASED', 'RENTED', 'LOANED'],
        units: ['MILES', 'HOURS', 'KILOMETERS', 'NONE'],
        fuels: FUEL_OPTIONS,
        incidents: CONNECTED_INCIDENTS,
        personsOfInterest: CONNECTED_POIS,
        maintenance: CONNECTED_MAINTENANCE,
      };
    },
  },

  Mutation: {
    createEquipment: async (
      _: unknown,
      args: {programId: string; input: WireEquipmentInput},
    ) => {
      await sleep();
      // A real gateway would resolve the org triple from programId. The mock
      // has no program registry, so it inherits it from an existing record —
      // with a literal fallback rather than a non-null assertion, because an
      // emptied store is reachable once deleteEquipment exists.
      const template = equipmentStore.records[0];
      const record: EquipmentDetail = {
        id: nextEquipmentId(),
        reference: nextReference(),
        serial: '',
        name: '',
        equipmentType: '',
        category: '',
        make: '',
        model: '',
        zone: '',
        program: template?.program ?? 'Louisville KY Training BBB 0000',
        region: template?.region ?? '914',
        division: template?.division ?? 'Central',
        status: 'Active',
        createdAt: new Date().toISOString(),
        acquiredAt: null,
        unit: 'None',
        beginningUsage: null,
        year: null,
        ownership: 'Owned',
        description: null,
        checkedOutBy: null,
        checkedOutAt: null,
        mine: false,
        queuedOffline: false,
        fuel: null,
        images: [],
        upkeeps: [],
        incidents: [],
        personsOfInterest: [],
        maintenance: [],
      };
      applyInput(record, args.input);
      insertRecord(record);
      return toDetailWire(record);
    },

    updateEquipment: async (
      _: unknown,
      args: {id: string; input: WireEquipmentInput},
    ) => {
      await sleep();
      const record = mustFind(args.id);
      applyInput(record, args.input);
      return toDetailWire(record);
    },

    // mustFind first, so an unknown id throws rather than silently no-opping —
    // the same contract deletePoi holds.
    deleteEquipment: async (_: unknown, args: {id: string}) => {
      await sleep();
      mustFind(args.id);
      removeRecord(args.id);
      return args.id;
    },

    // The SDL's CheckOutEquipmentInput also carries hasAbnormality,
    // abnormality, description and images — the source mockup collects them
    // but its own store discards them too, and Equipment has no field to
    // hold them. Narrowing the param type here documents that on purpose.
    checkOutEquipment: async (
      _: unknown,
      {input}: {input: {id: string; occurredAt: string}},
    ) => {
      await sleep();
      const record = mustFind(input.id);
      record.status = 'Checked-Out';
      // 'You' is the holder convention across this app's mocks — see
      // src/mocks/fixture.ts's YOU. Keeps seeded records and freshly
      // checked-out ones reading identically.
      record.checkedOutBy = 'You';
      record.checkedOutAt = input.occurredAt;
      record.mine = true;
      return toDetailWire(record);
    },

    // Same deliberate omission as checkOutEquipment: CheckInEquipmentInput's
    // hasAbnormality, abnormality, description and images are accepted by
    // the SDL but have nowhere to land on Equipment, so they're dropped here.
    checkInEquipment: async (
      _: unknown,
      {input}: {input: {id: string}},
    ) => {
      await sleep();
      const record = mustFind(input.id);
      record.status = 'Active';
      record.checkedOutBy = null;
      record.checkedOutAt = null;
      record.mine = false;
      return toDetailWire(record);
    },

    // AddEquipmentUpkeepInput also carries images — accepted by the SDL, but
    // EquipmentUpkeep has no field to store them, so this drops them like
    // the source mockup's own store does.
    addEquipmentUpkeep: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          id: string;
          upkeepType: string;
          occurredAt: string;
          vendor: string;
          currentUsage: string;
          cost: string;
          zone: string | null;
          description: string | null;
        };
      },
    ) => {
      await sleep();
      const record = mustFind(input.id);
      upkeepSeq += 1;
      // Unshift, not push — the detail screen renders upkeeps newest-first in
      // array order. Safe in place: each record owns its own array (store.ts's
      // detailDefaults() is a factory precisely so this cannot cross-file).
      record.upkeeps.unshift({
        id: `up_new_${upkeepSeq}`,
        upkeepType: input.upkeepType,
        occurredAt: input.occurredAt,
        vendor: input.vendor || null,
        cost: input.cost || null,
        currentUsage: input.currentUsage || null,
        zone: input.zone || null,
        description: input.description || null,
      });
      return toDetailWire(record);
    },
  },
};

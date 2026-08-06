import {
  PoiDisposition,
  PoiInteraction,
  PoiRecord,
  PoiUpdate,
} from '../../../types/poi';
import {
  BUSINESS_LOCATIONS,
  DISPOSITIONS,
  EQUIPMENT_OPTIONS,
  GENDERS,
  INCIDENT_OPTIONS,
  INTERACTION_TYPES,
  MAINTENANCE_OPTIONS,
  PERSON_TYPES,
  POI_FIXTURES,
  RACES,
  VIOLATIONS,
} from '../../../mocks/poi';
import {sleep} from '../../mockSession';
import {ZONES} from '../shared/options';
import {
  findRecord,
  nextInteractionReference,
  nextPersonReference,
  nextUpdateReference,
  poiStore,
} from './store';

/** Same static demo location Fixture stamps on every record it creates. */
const DEFAULT_ADDRESS = 'Rue Des Hauteurs, Val-David, Quebec J0T 2N0, Canada';
const DEFAULT_ZONE = ZONES[2];

const DISPOSITION_OUT: Record<PoiDisposition, string> = {
  Active: 'ACTIVE',
  Deceased: 'DECEASED',
  Housed: 'HOUSED',
  'In-active': 'IN_ACTIVE',
  Incarcerated: 'INCARCERATED',
  'Transitional Care': 'TRANSITIONAL_CARE',
};

const DISPOSITION_IN: Record<string, PoiDisposition> = {
  ACTIVE: 'Active',
  DECEASED: 'Deceased',
  HOUSED: 'Housed',
  IN_ACTIVE: 'In-active',
  INCARCERATED: 'Incarcerated',
  TRANSITIONAL_CARE: 'Transitional Care',
};

/**
 * Nested records map through their own helpers rather than riding a spread, so
 * a field added to PoiInteraction later can't silently bypass the wire mapper —
 * which is exactly how a nested enum gets shipped un-uppercased.
 */
const toWireInteraction = (i: PoiInteraction) => ({
  id: i.id,
  reference: i.reference,
  interactionType: i.interactionType,
  occurredAt: i.occurredAt,
  zone: i.zone,
  fixture: i.fixture,
  businessLocation: i.businessLocation,
  violation: i.violation,
  note: i.note,
  documents: i.documents,
});

const toWireUpdate = (u: PoiUpdate) => ({
  id: u.id,
  reference: u.reference,
  occurredAt: u.occurredAt,
  zone: u.zone,
  description: u.description,
});

/** Display-shape record → wire shape (disposition uppercased, count derived). */
export const toWire = (record: PoiRecord) => ({
  ...record,
  disposition: DISPOSITION_OUT[record.disposition],
  interactionCount: record.interactions.length,
  interactions: record.interactions.map(toWireInteraction),
  updates: record.updates.map(toWireUpdate),
});

interface WireContactInput {
  name: string;
  email: string;
  phone: string;
  relationship: string;
  notes: string;
}

interface WirePoiInput {
  name: string;
  personType: string;
  disposition: string;
  occurredAt: string;
  contact?: string | null;
  top1020: boolean;
  alias?: string | null;
  gender?: string | null;
  age?: string | null;
  race?: string | null;
  weight?: string | null;
  height?: string | null;
  physicalDescription?: string | null;
  situation?: string | null;
  contacts: WireContactInput[];
  connectedIncidents: string[];
  connectedMaintenance: string[];
  connectedEquipment: string[];
}

interface WireInteractionInput {
  interactionType: string;
  occurredAt: string;
  zone: string;
  fixture?: string | null;
  businessLocation?: string | null;
  violation?: string | null;
  note?: string | null;
  documents: string[];
}

interface WireUpdateInput {
  occurredAt: string;
  zone: string;
  description: string;
}

/**
 * `address`, `zone`, `describeLocation` and both timelines are deliberately
 * absent: they aren't in PoiInput, so an edit must leave them alone rather than
 * clear them.
 */
const applyInput = (record: PoiRecord, input: WirePoiInput): void => {
  record.name = input.name;
  record.personType = input.personType;
  record.disposition = DISPOSITION_IN[input.disposition];
  record.contact = input.contact ?? null;
  record.top1020 = input.top1020;
  record.alias = input.alias ?? null;
  record.gender = input.gender ?? null;
  record.age = input.age ?? null;
  record.race = input.race ?? null;
  record.weight = input.weight ?? null;
  record.height = input.height ?? null;
  record.physicalDescription = input.physicalDescription ?? null;
  record.situation = input.situation ?? null;
  record.contacts = input.contacts.map(c => ({...c}));
  record.connectedIncidents = [...input.connectedIncidents];
  record.connectedMaintenance = [...input.connectedMaintenance];
  record.connectedEquipment = [...input.connectedEquipment];
};

const people = () => poiStore.records.map(r => ({id: r.id, name: r.name}));

export const poiResolvers = {
  Query: {
    // `filter` is accepted and ignored: the screen still filters client-side,
    // same convention as fixtures and maintenanceRequests.
    pois: async () => {
      await sleep();
      return poiStore.records.map(toWire);
    },

    poi: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findRecord(args.id);
      return record ? toWire(record) : null;
    },

    poiFormOptions: async () => {
      await sleep();
      return {
        nextReference: nextPersonReference(),
        personTypes: PERSON_TYPES,
        dispositions: DISPOSITIONS,
        genders: GENDERS,
        races: RACES,
        incidentOptions: INCIDENT_OPTIONS,
        maintenanceOptions: MAINTENANCE_OPTIONS,
        equipmentOptions: EQUIPMENT_OPTIONS,
      };
    },

    poiInteractionFormOptions: async () => {
      await sleep();
      return {
        nextReference: nextInteractionReference(),
        people: people(),
        interactionTypes: INTERACTION_TYPES,
        violations: VIOLATIONS,
        zones: ZONES,
        fixtures: POI_FIXTURES,
        businessLocations: BUSINESS_LOCATIONS,
      };
    },

    poiUpdateFormOptions: async () => {
      await sleep();
      return {
        nextReference: nextUpdateReference(),
        people: people(),
        zones: ZONES,
      };
    },
  },

  Mutation: {
    createPoi: async (
      _: unknown,
      args: {programId: string; input: WirePoiInput},
    ) => {
      await sleep();
      const reference = nextPersonReference();
      const record: PoiRecord = {
        id: `poi_${reference.replace('#POI-', '')}`,
        reference,
        name: '',
        personType: '',
        disposition: 'Active',
        // Stamped from device state — the form has no Location section.
        zone: DEFAULT_ZONE,
        address: DEFAULT_ADDRESS,
        // Created by the Ambassador, same convention as Fixture.
        createdBy: {name: 'You', initials: 'YO'},
        queuedOffline: false,
        lastModifiedAt: args.input.occurredAt,
        firstSeenAt: args.input.occurredAt,
        lastModifiedBy: 'You',
        contact: null,
        top1020: false,
        alias: null,
        gender: null,
        age: null,
        race: null,
        weight: null,
        height: null,
        physicalDescription: null,
        situation: null,
        // Never collected by the form — see the module's design doc.
        describeLocation: null,
        contacts: [],
        connectedIncidents: [],
        connectedMaintenance: [],
        connectedEquipment: [],
        interactions: [],
        updates: [],
      };
      applyInput(record, args.input);
      poiStore.records.unshift(record);
      return toWire(record);
    },

    updatePoi: async (_: unknown, args: {id: string; input: WirePoiInput}) => {
      await sleep();
      const record = findRecord(args.id);
      if (!record) {
        throw new Error(`Unknown person: ${args.id}`);
      }
      applyInput(record, args.input);
      record.lastModifiedAt = new Date().toISOString();
      record.lastModifiedBy = 'You';
      return toWire(record);
    },

    deletePoi: async (_: unknown, args: {id: string}) => {
      await sleep();
      const index = poiStore.records.findIndex(r => r.id === args.id);
      if (index < 0) {
        throw new Error(`Unknown person: ${args.id}`);
      }
      // The person's interactions and updates live on the record, so they go
      // with it — which is what the confirm dialog's copy promises.
      poiStore.records.splice(index, 1);
      return args.id;
    },

    addPoiInteraction: async (
      _: unknown,
      args: {personId: string; input: WireInteractionInput},
    ) => {
      await sleep();
      const record = findRecord(args.personId);
      if (!record) {
        throw new Error(`Unknown person: ${args.personId}`);
      }
      const reference = nextInteractionReference();
      const created: PoiInteraction = {
        id: `int_${reference.replace('#INT-', '')}`,
        reference,
        interactionType: args.input.interactionType,
        occurredAt: args.input.occurredAt,
        zone: args.input.zone,
        fixture: args.input.fixture ?? null,
        businessLocation: args.input.businessLocation ?? null,
        violation: args.input.violation ?? null,
        note: args.input.note ?? null,
        documents: args.input.documents,
      };
      // Newest first, matching the view's own insertBefore.
      record.interactions.unshift(created);
      record.lastModifiedAt = new Date().toISOString();
      record.lastModifiedBy = 'You';
      return toWireInteraction(created);
    },

    addPoiUpdate: async (
      _: unknown,
      args: {personId: string; input: WireUpdateInput},
    ) => {
      await sleep();
      const record = findRecord(args.personId);
      if (!record) {
        throw new Error(`Unknown person: ${args.personId}`);
      }
      const reference = nextUpdateReference();
      const created: PoiUpdate = {
        id: `upd_${reference.replace('#UPD-', '')}`,
        reference,
        occurredAt: args.input.occurredAt,
        zone: args.input.zone,
        description: args.input.description,
      };
      record.updates.unshift(created);
      record.lastModifiedAt = new Date().toISOString();
      record.lastModifiedBy = 'You';
      return toWireUpdate(created);
    },
  },
};

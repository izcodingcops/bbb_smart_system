import {sleep} from '../../mockSession';
import {findRecord, referenceDocumentStore} from './store';

/** Unique, sorted values of one field across every seeded record. */
const distinctSorted = (values: string[]): string[] =>
  Array.from(new Set(values)).sort();

export const referenceDocumentResolvers = {
  Query: {
    // No filter argument: the screen filters, sorts and searches
    // client-side, same convention as fixtures/observation reports.
    referenceDocuments: async () => {
      await sleep();
      return referenceDocumentStore.records;
    },

    referenceDocument: async (_: unknown, args: {id: string}) => {
      await sleep();
      return findRecord(args.id) ?? null;
    },

    // Derived from the store rather than a hardcoded list, so the option
    // list can never drift from what the records actually carry — there is
    // no create form here to keep a separate picklist in sync with.
    referenceDocumentFilterOptions: async () => {
      await sleep();
      return {
        entryTypes: distinctSorted(
          referenceDocumentStore.records.map(r => r.entryType),
        ),
        businesses: distinctSorted(
          referenceDocumentStore.records.map(r => r.business),
        ),
        zones: distinctSorted(referenceDocumentStore.records.map(r => r.zone)),
      };
    },
  },
};

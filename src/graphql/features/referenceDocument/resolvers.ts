import {sleep} from '../../mockSession';
import {findRecord, referenceDocumentStore} from './store';

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
  },
};

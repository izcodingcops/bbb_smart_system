import {ReferenceDocument} from '../../../types/referenceDocument';
import {MOCK_REFERENCE_DOCUMENTS} from '../../../mocks/referenceDocument';

export const referenceDocumentStore: {records: ReferenceDocument[]} = {
  records: MOCK_REFERENCE_DOCUMENTS,
};

export function findRecord(id: string): ReferenceDocument | undefined {
  return referenceDocumentStore.records.find(r => r.id === id);
}

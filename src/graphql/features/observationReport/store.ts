import {ObservationReport} from '../../../types/observationReport';
import {MOCK_OBSERVATION_REPORTS} from '../../../mocks/observationReport';

export const observationReportStore: {records: ObservationReport[]} = {
  records: MOCK_OBSERVATION_REPORTS,
};

export function findRecord(id: string): ObservationReport | undefined {
  return observationReportStore.records.find(r => r.id === id);
}

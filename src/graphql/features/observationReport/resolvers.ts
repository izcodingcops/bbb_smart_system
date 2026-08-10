import {ObservationReport} from '../../../types/observationReport';
import {sleep} from '../../mockSession';
import {findRecord, observationReportStore} from './store';

const TYPE_OUT: Record<ObservationReport['type'], string> = {
  Ambassador: 'AMBASSADOR',
  Supervisor: 'SUPERVISOR',
};

export const toWire = (record: ObservationReport) => ({
  ...record,
  type: TYPE_OUT[record.type],
});

export const observationReportResolvers = {
  Query: {
    // No filter argument: the screen filters, sorts and searches
    // client-side, same convention as fixtures.
    observationReports: async () => {
      await sleep();
      return observationReportStore.records.map(toWire);
    },

    observationReport: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findRecord(args.id);
      return record ? toWire(record) : null;
    },
  },
};

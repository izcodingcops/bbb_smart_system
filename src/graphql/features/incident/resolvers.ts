import {IncidentDetail} from '../../../types/incident';
import {sleep} from '../../mockSession';
import {MOCK_INCIDENT_FORM_OPTIONS} from '../../../mocks/incident';
import {findRecord, incidentStore, nextReference} from './store';

const STATUS: Record<IncidentDetail['status'], string> = {
  Open: 'OPEN',
  'In-progress': 'IN_PROGRESS',
  Completed: 'COMPLETED',
};
const PRIORITY: Record<IncidentDetail['priority'], string> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
};

/** Display-shape record → wire shape (both enums uppercased). Exported for Task 11's dispatch join. */
export const toWire = (record: IncidentDetail) => ({
  ...record,
  status: STATUS[record.status],
  priority: PRIORITY[record.priority],
});

export const incidentResolvers = {
  Query: {
    // `filter` is accepted and ignored: the screen filters, sorts and
    // searches client-side via src/screens/incident/filtering.ts, same
    // convention as Fixture, Maintenance and Dispatch.
    incidents: async () => {
      await sleep();
      return incidentStore.records.map(toWire);
    },

    incident: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findRecord(args.id);
      return record ? toWire(record) : null;
    },

    incidentFormOptions: async () => {
      await sleep();
      return {
        ...MOCK_INCIDENT_FORM_OPTIONS,
        nextReference: nextReference(),
      };
    },
  },
};

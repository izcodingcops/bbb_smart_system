import {
  DispatchDetail,
  DispatchIncident,
  DispatchPriority,
  DispatchStatus,
} from '../../../types/dispatch';
import {sleep} from '../../mockSession';
import {dispatchStore, findRecord} from './store';

const STATUS: Record<DispatchStatus, string> = {
  Open: 'OPEN',
  Escalated: 'ESCALATED',
  Closed: 'CLOSED',
};

const PRIORITY: Record<DispatchPriority, string> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
};

const incidentToWire = (incident: DispatchIncident) => ({
  ...incident,
  priority: PRIORITY[incident.priority],
});

/** Display-shape record → wire shape (both enums uppercased). */
export const toWire = (record: DispatchDetail) => ({
  ...record,
  status: STATUS[record.status],
  priority: PRIORITY[record.priority],
  incidents: record.incidents.map(incidentToWire),
});

export const dispatchResolvers = {
  Query: {
    // `filter` is accepted and ignored: the screen still filters client-side,
    // same convention as fixtures and maintenanceRequests.
    dispatches: async () => {
      await sleep();
      return dispatchStore.records.map(toWire);
    },

    dispatch: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findRecord(args.id);
      return record ? toWire(record) : null;
    },
  },
};

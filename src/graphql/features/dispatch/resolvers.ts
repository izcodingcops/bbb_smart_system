import {DispatchDetail, DispatchPriority, DispatchStatus} from '../../../types/dispatch';
import {sleep} from '../../mockSession';
import {toWire as incidentToWire} from '../incident/resolvers';
import {incidentStore} from '../incident/store';
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

/** Display-shape record → wire shape (both enums uppercased). */
export const toWire = (record: DispatchDetail) => ({
  ...record,
  status: STATUS[record.status],
  priority: PRIORITY[record.priority],
});

/** Every incident linked to this dispatch via `dispatchReference` — whether created through this dispatch's own "Add Incident" flow or seeded that way — joined fresh on every read. */
function incidentsFor(dispatchId: string) {
  return incidentStore.records
    .filter(incident => incident.dispatchReference === dispatchId)
    .map(incidentToWire);
}

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
      if (!record) {
        return null;
      }
      return {...toWire(record), incidents: incidentsFor(args.id)};
    },
  },
};

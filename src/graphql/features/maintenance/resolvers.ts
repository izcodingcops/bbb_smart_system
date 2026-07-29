import {MaintenanceDetail} from '../../../types/maintenance';
import {sleep} from '../../mockSession';
import {findRecord, maintenanceStore} from './store';

const STATUS: Record<string, string> = {
  Open: 'OPEN',
  'In-progress': 'IN_PROGRESS',
  Completed: 'COMPLETED',
};
const PRIORITY: Record<string, string> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
};
const ASSIGNEE_KIND: Record<string, string> = {
  Supervisor: 'SUPERVISOR',
  Department: 'DEPARTMENT',
};

/** Display-shape record → wire shape (enums uppercased, reference filled). */
export const toWire = (record: MaintenanceDetail) => ({
  ...record,
  reference: record.id,
  status: STATUS[record.status],
  priority: PRIORITY[record.priority],
  assigneeKind: ASSIGNEE_KIND[record.assigneeKind],
});

export const maintenanceResolvers = {
  Query: {
    // `filter` is accepted and ignored: the screen still filters client-side.
    // When the server implements it, the document and call site already match.
    maintenanceRequests: async () => {
      await sleep();
      return maintenanceStore.records.map(toWire);
    },

    maintenanceRequest: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findRecord(args.id);
      return record ? toWire(record) : null;
    },
  },
};

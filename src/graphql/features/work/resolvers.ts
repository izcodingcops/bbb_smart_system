import {MOCK_QUICK_ACTIONS, toWorkLogWorkItem} from '../../../mocks';
import {toMaintenanceWorkItem} from '../../../mocks/workItems';
import {WorkStatus} from '../../../types/work';
import {sleep} from '../../mockSession';
import {maintenanceStore} from '../maintenance/store';
import {workLogStore} from '../workLog/store';
import {findWorkItem, workStore} from './store';

const STATUS: Record<WorkStatus, string> = {
  Open: 'OPEN',
  'In-progress': 'IN_PROGRESS',
  Completed: 'COMPLETED',
};
const STATUS_IN: Record<string, WorkStatus> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In-progress',
  COMPLETED: 'Completed',
};
const PRIORITY: Record<string, string> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
};
const BUCKET: Record<string, string> = {
  assigned: 'ASSIGNED',
  unassigned: 'UNASSIGNED',
  completed: 'COMPLETED',
};

const toWire = (item: ReturnType<typeof findWorkItem>) =>
  item && {
    id: item.id,
    ticketNumber: item.reference,
    category: item.category,
    status: STATUS[item.status],
    occurredAt: item.date,
    type: item.type,
    priority: PRIORITY[item.priority],
    zone: item.zone,
    assignee: item.assignee,
    assigneeInitials: item.assigneeInitials,
    address: item.address,
    bucket: BUCKET[item.bucket],
    outcome: item.outcome ?? null,
    interaction: item.interaction ?? null,
    disposition: item.disposition ?? null,
    businessName: item.businessName ?? null,
    quantity: item.quantity ?? null,
  };

export const workResolvers = {
  Query: {
    // The screen buckets client-side via applyBucket, same convention as the
    // `filter: null` Fixture and Maintenance queries use.
    //
    // Activity (Work Log) and Maintenance items are recomputed live from
    // workLogStore.records / maintenanceStore.records rather than read from
    // the static workStore.items snapshot: their own feature mutations edit
    // those stores in place, and workStore.items was only ever seeded once
    // at module load. Without this, a created/edited/deleted Work Log entry
    // or an assigned/updated Maintenance request would never be reflected
    // here. Fixture items don't get the same live treatment — that's a
    // pre-existing gap in this aggregation, out of scope here.
    workItems: async () => {
      await sleep();
      const seeded = workStore.items.filter(
        item => item.category !== 'Activity' && item.category !== 'Maintenance',
      );
      const maintenanceItems = maintenanceStore.records.map(toMaintenanceWorkItem);
      const workLogItems = workLogStore.records.map(toWorkLogWorkItem);
      return [...seeded, ...maintenanceItems, ...workLogItems].map(item =>
        toWire(item),
      );
    },

    quickActions: async () => {
      await sleep();
      return MOCK_QUICK_ACTIONS;
    },
  },

  Mutation: {
    setWorkItemStatus: async (
      _p: unknown,
      args: {id: string; status: string},
    ) => {
      await sleep();
      const item = findWorkItem(args.id);
      if (!item) {
        throw new Error(`Unknown work item: ${args.id}`);
      }
      item.status = STATUS_IN[args.status];
      item.bucket = item.status === 'Completed' ? 'completed' : 'assigned';
      return toWire(item);
    },
  },
};

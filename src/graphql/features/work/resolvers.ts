import {MOCK_QUICK_ACTIONS, MOCK_WORK_ITEMS} from '../../../mocks';
import {sleep} from '../../mockSession';

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
const BUCKET: Record<string, string> = {
  assigned: 'ASSIGNED',
  completed: 'COMPLETED',
};

export const workResolvers = {
  Query: {
    workItems: async (_p: unknown, {bucket}: {bucket?: string | null}) => {
      await sleep();
      return MOCK_WORK_ITEMS.filter(
        item => !bucket || BUCKET[item.bucket] === bucket,
      ).map(item => ({
        id: item.id,
        ticketNumber: item.id,
        category: item.category,
        status: STATUS[item.status],
        occurredAt: item.date,
        type: item.type,
        priority: PRIORITY[item.priority],
        assignee: item.assignee,
        assigneeInitials: item.assigneeInitials,
        address: item.address,
        bucket: BUCKET[item.bucket],
      }));
    },

    quickActions: async () => {
      await sleep();
      return MOCK_QUICK_ACTIONS;
    },
  },
};

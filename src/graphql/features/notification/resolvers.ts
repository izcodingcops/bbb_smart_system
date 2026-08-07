import {
  AppNotification,
  NotificationIcon,
  NotificationModule,
  NotificationRecordType,
} from '../../../types/notification';
import {sleep} from '../../mockSession';
import {findRecord, notificationStore, unreadCount} from './store';

const MODULE: Record<NotificationModule, string> = {
  Maintenance: 'MAINTENANCE',
  Incident: 'INCIDENT',
  Fixture: 'FIXTURE',
  Equipment: 'EQUIPMENT',
  Cleaning: 'CLEANING',
  POI: 'POI',
  System: 'SYSTEM',
};

const ICON: Record<NotificationIcon, string> = {
  Sync: 'SYNC',
  Comment: 'COMMENT',
  Clock: 'CLOCK',
  Bell: 'BELL',
};

/**
 * `WorkLog` ↔ `WORK_LOG` is the one pair a mechanical transform would get
 * wrong, so every pair is spelled out rather than derived.
 */
const RECORD_TYPE: Record<NotificationRecordType, string> = {
  Maintenance: 'MAINTENANCE',
  Incident: 'INCIDENT',
  Fixture: 'FIXTURE',
  Poi: 'POI',
  WorkLog: 'WORK_LOG',
};

/**
 * Display-shape record → wire shape. `related` is an object, so the enum inside
 * it has to be uppercased too — uppercasing only the top level is the nested
 * enum trap this module family has already been bitten by.
 */
export const toWire = (record: AppNotification) => ({
  ...record,
  module: MODULE[record.module],
  icon: record.icon ? ICON[record.icon] : null,
  related: record.related
    ? {
        ...record.related,
        recordType: RECORD_TYPE[record.related.recordType],
      }
    : null,
});

export const notificationResolvers = {
  Query: {
    notifications: async () => {
      await sleep();
      return notificationStore.records.map(toWire);
    },

    unreadNotificationCount: async () => {
      await sleep();
      return unreadCount();
    },
  },

  Mutation: {
    markNotificationRead: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findRecord(args.id);
      if (!record) {
        throw new Error(`Unknown notification: ${args.id}`);
      }
      record.unread = false;
      return toWire(record);
    },

    markAllNotificationsRead: async () => {
      await sleep();
      notificationStore.records.forEach(record => {
        record.unread = false;
      });
      return notificationStore.records.map(toWire);
    },
  },
};

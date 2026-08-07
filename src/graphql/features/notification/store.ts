import {AppNotification} from '../../../types/notification';
import {MOCK_NOTIFICATIONS} from '../../../mocks/notification';

/** Seeded once per app session; the read mutations edit this array in place. */
export const notificationStore: {records: AppNotification[]} = {
  records: MOCK_NOTIFICATIONS.map(record => ({...record})),
};

export function findRecord(id: string): AppNotification | undefined {
  return notificationStore.records.find(r => r.id === id);
}

export function unreadCount(): number {
  return notificationStore.records.filter(r => r.unread).length;
}

import {gql} from '@apollo/client';

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($programId: ID!) {
    notifications(programId: $programId) {
      id
      module
      title
      message
      icon
      createdAt
      unread
      related {
        recordType
        recordId
        reference
        title
      }
    }
  }
`;

export const GET_UNREAD_NOTIFICATION_COUNT = gql`
  query GetUnreadNotificationCount($programId: ID!) {
    unreadNotificationCount(programId: $programId)
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      id
      unread
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead($programId: ID!) {
    markAllNotificationsRead(programId: $programId) {
      id
      unread
    }
  }
`;

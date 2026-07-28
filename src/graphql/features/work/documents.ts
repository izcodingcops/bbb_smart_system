import {gql} from '@apollo/client';

export const GET_WORK_ITEMS = gql`
  query GetWorkItems($programId: ID!, $bucket: WorkBucket) {
    workItems(programId: $programId, bucket: $bucket) {
      id
      ticketNumber
      category
      status
      occurredAt
      type
      priority
      assignee
      assigneeInitials
      address
      bucket
    }
  }
`;

export const GET_QUICK_ACTIONS = gql`
  query GetQuickActions($programId: ID!) {
    quickActions(programId: $programId) {
      id
      label
      tint
      iconColor
      icon
    }
  }
`;

import {gql} from '@apollo/client';

export const GET_WORK_ITEMS = gql`
  query GetWorkItems($programId: ID!) {
    workItems(programId: $programId) {
      id
      ticketNumber
      category
      status
      occurredAt
      type
      priority
      zone
      assignee
      assigneeInitials
      address
      bucket
      outcome
      interaction
      disposition
      businessName
      quantity
      createdBy
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

export const SET_WORK_ITEM_STATUS = gql`
  mutation SetWorkItemStatus($id: ID!, $status: WorkStatus!) {
    setWorkItemStatus(id: $id, status: $status) {
      id
      status
      bucket
    }
  }
`;

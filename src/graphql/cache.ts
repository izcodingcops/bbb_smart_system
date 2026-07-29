import {InMemoryCache} from '@apollo/client';

/**
 * Every entity carries a stable `id`, so the default normalisation works. The
 * explicit keyFields document that and fail loudly if a document forgets to
 * select `id`.
 */
export const cache = new InMemoryCache({
  typePolicies: {
    User: {keyFields: ['id']},
    Program: {keyFields: ['id']},
    ShiftType: {keyFields: ['id']},
    MenuItem: {keyFields: ['id']},
    WorkItem: {keyFields: ['id']},
    QuickAction: {keyFields: ['id']},
    EquipmentItem: {keyFields: ['id']},
    MaintenanceRequest: {keyFields: ['id']},
    // Assignee has no id; keep it embedded in its parent request.
    MaintenanceAssignee: {keyFields: false},
    Fixture: {keyFields: ['id']},
    FixtureCreator: {keyFields: false},
  },
});

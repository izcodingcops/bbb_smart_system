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
    MaintenanceComment: {keyFields: ['id']},
    Fixture: {keyFields: ['id']},
    FixtureCreator: {keyFields: false},
    Dispatch: {keyFields: ['id']},
    DispatchEscalation: {keyFields: ['id']},
    DispatchIncident: {keyFields: ['id']},
    // No id of their own; keep them embedded in the incident they belong to.
    DispatchResponderInfo: {keyFields: false},
    DispatchParty: {keyFields: false},
    DispatchVehicle: {keyFields: false},
    // No id of its own — options belong to the query that asked for them.
    DispatchIncidentFormOptions: {keyFields: false},
    WorkLogEntry: {keyFields: ['id']},
  },
});

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
    Equipment: {keyFields: ['id']},
    EquipmentDetail: {keyFields: ['id']},
    EquipmentUpkeep: {keyFields: ['id']},
    EquipmentFormOptions: {keyFields: false},
    // Taxonomy nodes are value objects with no id — without keyFields: false
    // Apollo would warn and could merge two same-named nodes sitting under
    // different branches of the Category → Type → Make tree.
    EquipmentCategoryOption: {keyFields: false},
    EquipmentTypeOption: {keyFields: false},
    EquipmentMakeOption: {keyFields: false},
    MaintenanceRequest: {keyFields: ['id']},
    // Assignee has no id; keep it embedded in its parent request.
    MaintenanceAssignee: {keyFields: false},
    MaintenanceComment: {keyFields: ['id']},
    Fixture: {keyFields: ['id']},
    FixtureCreator: {keyFields: false},
    Incident: {keyFields: ['id']},
    // No id of their own; keep them embedded in the incident they belong to.
    IncidentAssignee: {keyFields: false},
    IncidentResponderInfo: {keyFields: false},
    IncidentParty: {keyFields: false},
    IncidentVehicle: {keyFields: false},
    IncidentComment: {keyFields: ['id']},
    // No id of its own — options belong to the query that asked for them.
    IncidentFormOptions: {keyFields: false},
    Dispatch: {keyFields: ['id']},
    DispatchEscalation: {keyFields: ['id']},
    Poi: {keyFields: ['id']},
    PoiInteraction: {keyFields: ['id']},
    PoiUpdate: {keyFields: ['id']},
    PoiPerson: {keyFields: ['id']},
    // No id of their own; keep them embedded in the person they belong to.
    PoiCreator: {keyFields: false},
    PoiContact: {keyFields: false},
    // No id of their own — options belong to the query that asked for them.
    PoiFormOptions: {keyFields: false},
    PoiInteractionFormOptions: {keyFields: false},
    PoiUpdateFormOptions: {keyFields: false},
    WorkLogEntry: {keyFields: ['id']},
    Notification: {keyFields: ['id']},
    // No id of its own; keep it embedded in the notification it belongs to.
    NotificationTarget: {keyFields: false},
    ObservationReport: {keyFields: ['id']},
    ObservationReviewer: {keyFields: false},
    ObservationChecklistItem: {keyFields: false},
    ReferenceDocument: {keyFields: ['id']},
    RvpSiteVisit: {keyFields: ['id']},
    RvpSiteVisitDetail: {keyFields: ['id']},
    // No id of their own; keep them embedded in the report they belong to.
    RvpAnsweredSection: {keyFields: false},
    RvpAnsweredGroup: {keyFields: false},
    RvpAnswer: {keyFields: false},
    RvpSectionText: {keyFields: false},
    // The served question tree and the options object that wraps it — all
    // id-less, all belonging to the query that asked for them.
    RvpSiteVisitFormOptions: {keyFields: false},
    RvpSection: {keyFields: false},
    RvpQuestionGroup: {keyFields: false},
    RvpQuestion: {keyFields: false},
    OffHoursVisit: {keyFields: ['id']},
    // No id of their own — the question set belongs to the query that asked
    // for it, and an option belongs to its question.
    OffHoursVisitFormOptions: {keyFields: false},
    OffHoursQuestion: {keyFields: false},
    OffHoursQuestionOption: {keyFields: false},
    ShiftNote: {keyFields: ['id']},
    // No id of its own — the options belong to the query that asked for them.
    ShiftNoteFormOptions: {keyFields: false},
  },
});

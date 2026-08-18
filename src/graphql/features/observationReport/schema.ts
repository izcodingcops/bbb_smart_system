export const observationReportTypeDefs = /* GraphQL */ `
  enum ObservationReportType {
    AMBASSADOR
    SUPERVISOR
  }

  type ObservationReviewer {
    name: String!
  }

  type ObservationChecklistItem {
    question: String!
    answer: String!
    note: String
  }

  type ObservationReport {
    id: ID!
    "Display reference, e.g. '#OBR-2043'."
    reference: String!
    type: ObservationReportType!
    name: String!
    "ISO-8601 date."
    date: String!
    "ISO-8601 datetime."
    dateTime: String!
    reviewedBy: ObservationReviewer!
    zone: String!
    score: Float!
    summary: String!
    checklist: [ObservationChecklistItem!]!
    images: [String!]!
  }

  "One fixed checklist question, keyed for the create/edit form's answer map."
  type ObservationQuestion {
    key: String!
    prompt: String!
  }

  type ObservationReportFormOptions {
    "Reserved when the form opens, e.g. '#OBR-3054'."
    nextReference: String!
    zones: [String!]!
    ambassadors: [String!]!
    supervisors: [String!]!
    questions: [ObservationQuestion!]!
  }

  input ObservationAnswerInput {
    "Question key. An unrecognised key is dropped, not stored."
    key: String!
    answer: String!
    "The 'why not' on a No, or Q5's training topic on a Yes."
    note: String
  }

  input ObservationReportInput {
    type: ObservationReportType!
    "The Ambassador or Supervisor being observed."
    name: String!
    zone: String!
    "ISO-8601."
    dateTime: String!
    answers: [ObservationAnswerInput!]!
    summary: String
    images: [String!]
  }

  extend type Query {
    observationReports(programId: ID!): [ObservationReport!]!
    observationReport(id: ID!): ObservationReport
    observationReportFormOptions(programId: ID!): ObservationReportFormOptions!
  }

  # Score is never taken from the client: create and update recompute it from
  # the submitted answers against the server's own 5-question tree. (A
  # comment rather than a description: type extensions don't accept one.)
  extend type Mutation {
    createObservationReport(
      programId: ID!
      input: ObservationReportInput!
    ): ObservationReport!
    updateObservationReport(id: ID!, input: ObservationReportInput!): ObservationReport!
    deleteObservationReport(id: ID!): ID!
  }
`;

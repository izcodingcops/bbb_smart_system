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
  }

  extend type Query {
    observationReports(programId: ID!): [ObservationReport!]!
    observationReport(id: ID!): ObservationReport
  }
`;

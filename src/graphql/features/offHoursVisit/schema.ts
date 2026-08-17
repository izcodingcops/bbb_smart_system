export const offHoursVisitTypeDefs = /* GraphQL */ `
  "How answering a question reveals its description box."
  enum OffHoursRevealRule {
    "Picking any option reveals it."
    ANY
    "Only a 'No' answer reveals it."
    YES_NO
  }

  type OffHoursQuestionOption {
    label: String!
    points: Int!
  }

  type OffHoursQuestion {
    key: String!
    prompt: String!
    "Italic sub-line. Empty when the question has none."
    hint: String!
    options: [OffHoursQuestionOption!]!
    reveal: OffHoursRevealRule!
    "Short numeric labels — renders the tight row instead of wrapping pills."
    numeric: Boolean!
  }

  "One answered question, denormalized onto the record."
  type OffHoursChecklistAnswer {
    "The prompt as it read when the report was filed."
    question: String!
    answer: String!
    points: Int!
    note: String!
    images: [String!]!
  }

  type OffHoursVisit {
    id: ID!
    "Display reference, e.g. '#OHV-1187'."
    reference: String!
    "Always 'Off Hour Visit'."
    type: String!
    "ISO-8601."
    capturedAt: String!
    zone: String!
    "Scored from the answers server-side — never the client's total."
    rating: Int!
    ratingMax: Int!
    auditNotes: String!
    checklist: [OffHoursChecklistAnswer!]!
    createdBy: String!
  }

  type OffHoursVisitFormOptions {
    "Reserved when the form opens, e.g. '#OHV-1187'."
    nextReference: String!
    "The locked Type value."
    type: String!
    zones: [String!]!
    questions: [OffHoursQuestion!]!
  }

  input OffHoursChecklistAnswerInput {
    "Question key. An unrecognised key is dropped, not stored."
    key: String!
    "The chosen option's label. Points are resolved from it server-side."
    answer: String!
    note: String
    images: [String!]
  }

  input OffHoursVisitInput {
    "ISO-8601."
    capturedAt: String!
    zone: String!
    auditNotes: String
    answers: [OffHoursChecklistAnswerInput!]!
  }

  extend type Query {
    offHoursVisitFormOptions(programId: ID!): OffHoursVisitFormOptions!
  }

  # Submit-only: there is no list or detail query, because submitted reports
  # are read back on the portal rather than in the app. (A comment rather than
  # a description — type extensions don't accept one.)
  extend type Mutation {
    createOffHoursVisit(
      programId: ID!
      input: OffHoursVisitInput!
    ): OffHoursVisit!
  }
`;

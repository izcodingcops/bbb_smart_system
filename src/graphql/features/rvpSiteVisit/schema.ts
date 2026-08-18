export const rvpSiteVisitTypeDefs = /* GraphQL */ `
  "Yes scores 1, No scores 0. There is deliberately no N/A."
  enum RvpAnswerValue {
    YES
    NO
  }

  enum RvpVisitType {
    FULL_SITE_VISIT
    DROP_IN_VISIT
    SPECIAL_PURPOSE
  }

  type RvpAnswer {
    "The prompt as it read when the report was filed."
    question: String!
    answer: RvpAnswerValue!
    "Empty unless the answer was NO — a note sent with a YES is dropped."
    note: String!
    images: [String!]!
  }

  type RvpAnsweredGroup {
    title: String!
    "ISO-8601. Empty when the group asks for no observation window."
    observedFrom: String!
    observedTo: String!
    "Empty when the group doesn't ask for it."
    howObserved: String!
    "Empty when the group has no notes box."
    notesLabel: String!
    notes: String!
    "Only the questions actually answered — a short group is what makes a report incomplete."
    answers: [RvpAnswer!]!
  }

  type RvpSectionText {
    label: String!
    value: String!
  }

  type RvpAnsweredSection {
    key: String!
    title: String!
    subtitle: String!
    groups: [RvpAnsweredGroup!]!
    texts: [RvpSectionText!]!
    "Yes-count within this section."
    score: Int!
    "Question count within this section — answered or not."
    scoreMax: Int!
  }

  "The list row. Carries no sections: at 74 answers a record, the list would be enormous."
  type RvpSiteVisit {
    id: ID!
    "Display reference, e.g. '#RVP-1188'."
    reference: String!
    program: String!
    operationManager: String!
    leaderPosition: String!
    "ISO-8601."
    startDate: String!
    endDate: String!
    reviewedBy: String!
    updatedBy: String!
    "ISO-8601."
    updatedAt: String!
    "Yes-count. Scored server-side — never the client's total."
    score: Int!
    scoreMax: Int!
    "score / scoreMax x 5, one decimal. Derived, never stored independently."
    avgScore: Float!
    "Every question in the tree answered."
    isComplete: Boolean!
  }

  """
  The full record. Restates every RvpSiteVisit field rather than sharing an
  interface — this schema has no SDL interfaces, and equipment's own
  Equipment/EquipmentDetail split reads the same way.
  """
  type RvpSiteVisitDetail {
    id: ID!
    reference: String!
    program: String!
    operationManager: String!
    leaderPosition: String!
    startDate: String!
    endDate: String!
    reviewedBy: String!
    updatedBy: String!
    updatedAt: String!
    score: Int!
    scoreMax: Int!
    avgScore: Float!
    isComplete: Boolean!
    visitType: RvpVisitType!
    "Empty for a Full Site Visit."
    reasonForVisit: String!
    images: [String!]!
    sections: [RvpAnsweredSection!]!
  }

  type RvpQuestion {
    "Stable key the form's answer maps use, e.g. 'field.g0.q2'."
    key: String!
    prompt: String!
  }

  type RvpQuestionGroup {
    key: String!
    title: String!
    "Group asks for an observation window."
    requiresTime: Boolean!
    "Group asks the required 'How observed' note."
    requiresHow: Boolean!
    "Label of the group's free-text box. Empty when it has none."
    notesLabel: String!
    questions: [RvpQuestion!]!
  }

  type RvpSection {
    key: String!
    title: String!
    subtitle: String!
    groups: [RvpQuestionGroup!]!
    textPrompts: [String!]!
  }

  type RvpSiteVisitFormOptions {
    "Reserved when the form opens, e.g. '#RVP-1189'."
    nextReference: String!
    programs: [String!]!
    visitTypes: [RvpVisitType!]!
    operationManagers: [String!]!
    sections: [RvpSection!]!
  }

  input RvpAnswerInput {
    "Question key. An unrecognised key is dropped, not stored."
    key: String!
    answer: RvpAnswerValue!
    "Ignored when the answer is YES."
    note: String
    images: [String!]
  }

  input RvpGroupInput {
    key: String!
    observedFrom: String
    observedTo: String
    howObserved: String
    notes: String
    answers: [RvpAnswerInput!]!
  }

  input RvpSectionInput {
    key: String!
    groups: [RvpGroupInput!]!
    "By index, matching the section's own textPrompts."
    texts: [String!]!
  }

  input RvpSiteVisitInput {
    program: String!
    visitType: RvpVisitType!
    "Ignored when visitType is FULL_SITE_VISIT."
    reasonForVisit: String
    "The leader position is resolved from this server-side, never sent."
    operationManager: String!
    startDate: String!
    endDate: String!
    images: [String!]
    sections: [RvpSectionInput!]!
  }

  extend type Query {
    rvpSiteVisits(programId: ID!): [RvpSiteVisit!]!
    "Null for an unknown id, which the detail screen's error branch handles."
    rvpSiteVisit(id: ID!): RvpSiteVisitDetail
    rvpSiteVisitFormOptions(programId: ID!): RvpSiteVisitFormOptions!
  }

  # Scores are never taken from the client: create and update recompute them
  # from the submitted answers against the server's own question tree. (A
  # comment rather than a description: type extensions don't accept one.)
  extend type Mutation {
    createRvpSiteVisit(
      programId: ID!
      input: RvpSiteVisitInput!
    ): RvpSiteVisitDetail!
    updateRvpSiteVisit(id: ID!, input: RvpSiteVisitInput!): RvpSiteVisitDetail!
    deleteRvpSiteVisit(id: ID!): ID!
  }
`;

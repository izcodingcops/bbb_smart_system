import {gql} from '@apollo/client';

export const GET_SHIFT_NOTE_FORM_OPTIONS = gql`
  query GetShiftNoteFormOptions($programId: ID!) {
    shiftNoteFormOptions(programId: $programId) {
      nextReference
      shiftTypes
      zones
      ambassadors
    }
  }
`;

export const CREATE_SHIFT_NOTE = gql`
  mutation CreateShiftNote($programId: ID!, $input: ShiftNoteInput!) {
    createShiftNote(programId: $programId, input: $input) {
      id
      reference
      sendToAll
      ambassador
      zone
    }
  }
`;

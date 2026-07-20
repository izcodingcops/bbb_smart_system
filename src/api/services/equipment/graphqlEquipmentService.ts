import {EquipmentListResponse, EquipmentServiceContract} from './contract';

/**
 * GraphQL implementation of the equipment contract. Not yet wired to a schema —
 * throws so switching API_TRANSPORT.equipment to 'graphql' fails loudly.
 */
export const graphqlEquipmentService = {
  getCheckedInEquipment: (): Promise<EquipmentListResponse> => {
    throw new Error(
      'graphqlEquipmentService.getCheckedInEquipment not implemented yet',
    );
  },
} satisfies EquipmentServiceContract;

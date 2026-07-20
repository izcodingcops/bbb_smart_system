import {apiSlice} from '../api/apiSlice';
import {withErrorLogging} from '../api/queryFnHelpers';
import {equipmentService} from '../../api/services/equipment/equipmentService';
import {EquipmentItem} from '../../types/equipment';

export const equipmentApi = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getCheckedInEquipment: builder.query<EquipmentItem[], void>({
      queryFn: () =>
        withErrorLogging(
          'EquipmentApi',
          'Failed to load equipment.',
          async () => {
            const response = await equipmentService.getCheckedInEquipment();
            return response.data;
          },
        ),
      providesTags: ['CheckedInEquipment'],
    }),
  }),
});

export const {useGetCheckedInEquipmentQuery} = equipmentApi;

import {apiSlice} from '../api/apiSlice';
import {programService} from '../../api/services/programService';
import {Program} from '../../types/program';

export const programApi = apiSlice.injectEndpoints({
  endpoints: builder => ({
    listPrograms: builder.query<Program[], void>({
      queryFn: async () => {
        try {
          const response = await programService.listPrograms();
          if (response.status !== 200) {
            return {error: {message: 'Failed to load programs.'}};
          }
          return {data: response.data};
        } catch (error: any) {
          return {error: {message: error?.message ?? 'Failed to load programs.'}};
        }
      },
      providesTags: ['Programs'],
    }),
  }),
});

export const {useListProgramsQuery} = programApi;

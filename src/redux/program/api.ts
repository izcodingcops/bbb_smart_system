import {apiSlice} from '../api/apiSlice';
import {withErrorLogging} from '../api/queryFnHelpers';
import {programService} from '../../api/services/programService';
import {Program} from '../../types/program';

export const programApi = apiSlice.injectEndpoints({
  endpoints: builder => ({
    listPrograms: builder.query<Program[], void>({
      queryFn: () =>
        withErrorLogging('ProgramApi', 'Failed to load programs.', async () => {
          const response = await programService.listPrograms();
          if (response.status !== 200) {
            throw new Error('Failed to load programs.');
          }
          return response.data;
        }),
      providesTags: ['Programs'],
    }),
  }),
});

export const {useListProgramsQuery} = programApi;

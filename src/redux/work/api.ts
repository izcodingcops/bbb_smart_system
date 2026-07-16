import {apiSlice} from '../api/apiSlice';
import {withErrorLogging} from '../api/queryFnHelpers';
import {workService} from '../../api/services/work/workService';
import {QuickAction, WorkItem} from '../../types/work';

export const workApi = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getWorkItems: builder.query<WorkItem[], void>({
      queryFn: () =>
        withErrorLogging('WorkApi', 'Failed to load work.', async () => {
          const response = await workService.getWorkItems();
          return response.data;
        }),
      providesTags: ['WorkItems'],
    }),
    getQuickActions: builder.query<QuickAction[], void>({
      queryFn: () =>
        withErrorLogging('WorkApi', 'Failed to load quick actions.', async () => {
          const response = await workService.getQuickActions();
          return response.data;
        }),
      providesTags: ['QuickActions'],
    }),
  }),
});

export const {useGetWorkItemsQuery, useGetQuickActionsQuery} = workApi;

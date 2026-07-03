import {apiSlice} from '../api/apiSlice';
import {withErrorLogging} from '../api/queryFnHelpers';
import {navigationService} from '../../api/services/navigation/navigationService';
import {MenuItem} from '../../types/navigation';

export const navigationApi = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getMenuItems: builder.query<MenuItem[], void>({
      queryFn: () =>
        withErrorLogging('NavigationApi', 'Failed to load menu.', async () => {
          const response = await navigationService.getMenuItems();
          return response.data;
        }),
      providesTags: ['MenuItems'],
    }),
  }),
});

export const {useGetMenuItemsQuery} = navigationApi;

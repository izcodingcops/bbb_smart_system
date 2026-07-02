import {apiSlice} from '../api/apiSlice';
import {withErrorLogging} from '../api/queryFnHelpers';
import {navigationRepository} from '../../api/mockApi';
import {MenuItem} from '../../types/navigation';

export const navigationApi = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getMenuItems: builder.query<MenuItem[], void>({
      queryFn: () =>
        withErrorLogging('NavigationApi', 'Failed to load menu.', () => navigationRepository.getMenuItems()),
      providesTags: ['MenuItems'],
    }),
  }),
});

export const {useGetMenuItemsQuery} = navigationApi;

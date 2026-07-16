import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer, createMigrate} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import rootReducer from './rootReducer';
import {apiSlice} from './api/apiSlice';
import {migrations, PERSIST_VERSION} from './migrations';

const persistConfig = {
  key: 'root',
  version: PERSIST_VERSION,
  storage: AsyncStorage,
  blacklist: ['api', 'ui'],
  migrate: createMigrate(migrations, {debug: __DEV__}),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({serializableCheck: false}).concat(apiSlice.middleware),
});
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

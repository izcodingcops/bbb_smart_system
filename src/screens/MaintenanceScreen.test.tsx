import React from 'react';
import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ReactTestRenderer, {act} from 'react-test-renderer';
import MaintenanceScreen from './MaintenanceScreen';
import maintenanceReducer from '../redux/maintenance/reducer';
import {maintenanceListSuccess} from '../redux/maintenance/actions';
import {MaintenanceRecord} from '../types/maintenance';

const record: MaintenanceRecord = {
  id: '1',
  ticket_number: '#96211407',
  status: 'Open',
  maintenance_type_id: 'Alley Cleaning',
  request_date: '2026-04-20T10:54:00.000Z',
  assignee_type: 'Ambassador',
  priority: 'High',
  address: '3 Rue Des Hauteurs',
  created_at: '2026-02-21T10:05:00.000Z',
};

const TestStack = createNativeStackNavigator();

function renderScreen() {
  const store = configureStore({reducer: {maintenance: maintenanceReducer}});
  jest.spyOn(store, 'dispatch');

  let root: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    root = ReactTestRenderer.create(
      <Provider store={store}>
        <NavigationContainer>
          <TestStack.Navigator screenOptions={{headerShown: false}}>
            <TestStack.Screen name="MaintenanceList" component={MaintenanceScreen} />
          </TestStack.Navigator>
        </NavigationContainer>
      </Provider>,
    );
  });
  return {root: root!, store};
}

describe('MaintenanceScreen', () => {
  test('dispatches a list request on mount', () => {
    const {store} = renderScreen();
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({type: 'maintenance/LIST_REQUEST'}),
    );
  });

  test('renders a card with a "View Details" action for each record in the store', () => {
    const {root, store} = renderScreen();
    act(() => {
      store.dispatch(maintenanceListSuccess([record]));
    });
    expect(() => root.root.findByProps({testID: 'maintenance-card-view-details'})).not.toThrow();
  });
});

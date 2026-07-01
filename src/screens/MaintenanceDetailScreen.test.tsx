import React from 'react';
import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ReactTestRenderer, {act} from 'react-test-renderer';
import MaintenanceDetailScreen from './MaintenanceDetailScreen';
import maintenanceReducer from '../redux/maintenance/reducer';
import {maintenanceDetailSuccess} from '../redux/maintenance/actions';
import {MaintenanceRecord} from '../types/maintenance';

const record: MaintenanceRecord = {
  id: '1',
  ticket_number: '#96211407',
  status: 'Open',
  maintenance_type_id: 'Alley Cleaning',
  request_date: '2026-04-20T10:54:00.000Z',
  assignee_type: 'Ambassador',
  priority: 'High',
  address: '3 Rue Des Hauteurs, Val-David, Quebec, J0T 2N0, Canada',
  created_at: '2026-02-21T10:05:00.000Z',
};

const TestStack = createNativeStackNavigator();

function renderScreen() {
  const store = configureStore({reducer: {maintenance: maintenanceReducer}});
  store.dispatch(maintenanceDetailSuccess(record));
  jest.spyOn(store, 'dispatch');

  let root: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    root = ReactTestRenderer.create(
      <Provider store={store}>
        <NavigationContainer>
          <TestStack.Navigator screenOptions={{headerShown: false}}>
            <TestStack.Screen
              name="MaintenanceDetail"
              component={MaintenanceDetailScreen}
              initialParams={{id: '1'}}
            />
          </TestStack.Navigator>
        </NavigationContainer>
      </Provider>,
    );
  });
  return {root: root!, store};
}

describe('MaintenanceDetailScreen', () => {
  test('opens the delete confirm dialog and dispatches delete on confirm', () => {
    const {root, store} = renderScreen();
    act(() => {
      root.root.findByProps({testID: 'maintenance-detail-delete'}).props.onPress();
    });
    act(() => {
      root.root.findByProps({testID: 'confirm-dialog-confirm'}).props.onPress();
    });
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({type: 'maintenance/DELETE_REQUEST'}),
    );
  });

  test('adds a comment from the comment sheet', () => {
    const {root, store} = renderScreen();
    act(() => {
      root.root.findByProps({testID: 'maintenance-detail-add-comment'}).props.onPress();
    });
    act(() => {
      root.root.findByProps({testID: 'maintenance-comment-input'}).props.onChangeText('Looks good');
    });
    act(() => {
      root.root.findByProps({testID: 'maintenance-comment-add'}).props.onPress();
    });
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'maintenance/COMMENT_REQUEST',
        payload: {id: '1', text: 'Looks good'},
      }),
    );
  });
});

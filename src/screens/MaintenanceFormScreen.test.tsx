jest.mock('@react-native-community/datetimepicker', () => {
  const {View} = require('react-native');
  return {__esModule: true, default: (props: any) => <View testID={props.testID} {...props} />};
});
jest.mock('react-native-image-picker', () => ({launchImageLibrary: jest.fn()}));

import React from 'react';
import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Text} from 'react-native';
import ReactTestRenderer, {act} from 'react-test-renderer';
import MaintenanceFormScreen from './MaintenanceFormScreen';
import maintenanceReducer from '../redux/maintenance/reducer';

const TestStack = createNativeStackNavigator();

function renderScreen(params: {id?: string} = {}) {
  const store = configureStore({
    reducer: {
      maintenance: maintenanceReducer,
      location: () => ({currentLocation: null}),
    },
  });
  jest.spyOn(store, 'dispatch');

  let root: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    root = ReactTestRenderer.create(
      <Provider store={store}>
        <NavigationContainer>
          <TestStack.Navigator screenOptions={{headerShown: false}}>
            <TestStack.Screen name="MaintenanceForm" component={MaintenanceFormScreen} initialParams={params} />
          </TestStack.Navigator>
        </NavigationContainer>
      </Provider>,
    );
  });
  return {root: root!, store};
}

describe('MaintenanceFormScreen', () => {
  test('shows the Save confirm dialog, then dispatches create on confirm', () => {
    const {root, store} = renderScreen();

    act(() => {
      root.root.findByProps({testID: 'maintenance-form-save'}).props.onPress();
    });
    expect(() => root.root.findByProps({testID: 'confirm-dialog-confirm'})).not.toThrow();

    act(() => {
      root.root.findByProps({testID: 'confirm-dialog-confirm'}).props.onPress();
    });

    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({type: 'maintenance/CREATE_REQUEST'}),
    );
  });

  test('edit mode shows "Update" and dispatches edit directly without a confirm dialog', () => {
    const {root, store} = renderScreen({id: '1'});
    const saveButton = root.root.findByProps({testID: 'maintenance-form-save'});
    const label = saveButton.findAllByType(Text)[0].props.children;
    expect(label).toBe('Update');

    act(() => {
      saveButton.props.onPress();
    });

    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({type: 'maintenance/EDIT_REQUEST'}),
    );
  });
});

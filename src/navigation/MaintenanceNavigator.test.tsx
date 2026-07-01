import React from 'react';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Text} from 'react-native';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {store} from '../redux/store';
import MaintenanceNavigator from './MaintenanceNavigator';

describe('MaintenanceNavigator', () => {
  test('renders the maintenance list as the initial screen', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(
        <Provider store={store}>
          <SafeAreaProvider>
            <NavigationContainer>
              <MaintenanceNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </Provider>,
      );
    });
    const titles = root!.root
      .findAllByType(Text)
      .filter(node => node.props.children === 'Maintenance');
    expect(titles.length).toBeGreaterThan(0);
  });
});

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {GetIsAuthenticated} from '../redux/auth/selectors';
import {GetHasActiveShift} from '../redux/shift/selectors';
import AuthNavigator from './AuthNavigator';
import SetupNavigator from './SetupNavigator';
import MainTabNavigator from './MainTabNavigator';
import {linking} from './linking';
import {theme} from '../theme';

export type RootStackParamList = {
  Auth: undefined;
  Setup: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const isAuthenticated = GetIsAuthenticated();
  const hasActiveShift = GetHasActiveShift();

  return (
    // A link can only resolve once the tab navigator is the mounted branch, so
    // one arriving mid-login or mid-setup is dropped rather than queued. That
    // matches the app's own rule: there is nothing to show a user without an
    // active shift.
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {backgroundColor: theme.colors.background},
        }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !hasActiveShift ? (
          <Stack.Screen name="Setup" component={SetupNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

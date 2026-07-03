import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import MaintenanceDetailScreen from '../screens/MaintenanceDetailScreen';
import MaintenanceFormScreen from '../screens/MaintenanceFormScreen';
import {theme} from '../theme';

export type MaintenanceStackParamList = {
  MaintenanceList: undefined;
  MaintenanceDetail: {id: string};
  MaintenanceForm: {id?: string};
};

const Stack = createNativeStackNavigator<MaintenanceStackParamList>();

const MaintenanceNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{headerShown: false, contentStyle: {backgroundColor: theme.colors.background}}}>
    <Stack.Screen name="MaintenanceList" component={MaintenanceScreen} />
    <Stack.Screen name="MaintenanceDetail" component={MaintenanceDetailScreen} />
    <Stack.Screen name="MaintenanceForm" component={MaintenanceFormScreen} />
  </Stack.Navigator>
);

export default MaintenanceNavigator;

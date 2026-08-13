import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {EquipmentStackParamList} from './routes';
import EquipmentScreen from './EquipmentScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<EquipmentStackParamList>();

const EquipmentNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      // Matches every other module's stack: the default push slide is long
      // enough to expose this stack's flat contentStyle before the
      // destination's own gradient background paints — a gray flash.
      animation: 'none',
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="EquipmentList" component={EquipmentScreen} />
  </Stack.Navigator>
);

export default EquipmentNavigator;

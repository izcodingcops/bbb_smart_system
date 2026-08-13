import React from 'react';
import {Alert} from 'react-native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {EquipmentStackParamList} from './routes';
import EquipmentScreen from './EquipmentScreen';
import ViewEquipmentScreen from './ViewEquipmentScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<EquipmentStackParamList>();

type ViewProps = NativeStackScreenProps<EquipmentStackParamList, 'EquipmentView'>;

/**
 * Slice 1 is the read surface — the three custody actions land in slice 2,
 * which replaces these three placeholders with navigation to their forms.
 */
const comingSoon = (action: string) =>
  Alert.alert(action, 'This is coming in the next update.');

const ViewRoute: React.FC<ViewProps> = ({navigation, route}) => (
  <ViewEquipmentScreen
    id={route.params.id}
    onClose={() => navigation.popTo('EquipmentList')}
    onCheckOut={() => comingSoon('Check-Out Equipment')}
    onCheckIn={() => comingSoon('Check-In')}
    onAddUpkeep={() => comingSoon('Add Upkeep')}
  />
);

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
    <Stack.Screen name="EquipmentView" component={ViewRoute} />
  </Stack.Navigator>
);

export default EquipmentNavigator;

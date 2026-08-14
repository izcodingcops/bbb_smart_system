import React from 'react';
import {Alert} from 'react-native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {EquipmentStackParamList} from './routes';
import EquipmentScreen from './EquipmentScreen';
import ViewEquipmentScreen from './ViewEquipmentScreen';
import CheckOutEquipmentScreen from './CheckOutEquipmentScreen';
import CheckInEquipmentScreen from './CheckInEquipmentScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<EquipmentStackParamList>();

type ViewProps = NativeStackScreenProps<EquipmentStackParamList, 'EquipmentView'>;
type CheckOutProps = NativeStackScreenProps<
  EquipmentStackParamList,
  'EquipmentCheckOut'
>;
type CheckInProps = NativeStackScreenProps<
  EquipmentStackParamList,
  'EquipmentCheckIn'
>;

/**
 * Slice 1 is the read surface — the three custody actions land in slice 2,
 * which replaces these placeholders with navigation to their forms one at a
 * time. Add Upkeep is still coming.
 */
const comingSoon = (action: string) =>
  Alert.alert(action, 'This is coming in the next update.');

const ViewRoute: React.FC<ViewProps> = ({navigation, route}) => (
  <ViewEquipmentScreen
    id={route.params.id}
    onClose={() => navigation.popTo('EquipmentList')}
    onCheckOut={() => navigation.navigate('EquipmentCheckOut', {id: route.params.id})}
    onCheckIn={() => navigation.navigate('EquipmentCheckIn', {id: route.params.id})}
    onAddUpkeep={() => comingSoon('Add Upkeep')}
  />
);

const CheckOutRoute: React.FC<CheckOutProps> = ({navigation, route}) => (
  <CheckOutEquipmentScreen
    id={route.params.id}
    onClose={() => navigation.goBack()}
    onDone={(reference, queued) =>
      navigation.popTo('EquipmentList', {
        toast: queued
          ? {
              title: 'Saved — will upload when back online',
              message:
                "This check-out is queued and will apply automatically once you're back online.",
              routeId: '',
              variant: 'danger',
            }
          : {
              title: 'Equipment checked out',
              message: "It's now in your Checked-Out tab.",
              routeId: route.params.id,
            },
      })
    }
  />
);

const CheckInRoute: React.FC<CheckInProps> = ({navigation, route}) => (
  <CheckInEquipmentScreen
    id={route.params.id}
    onClose={() => navigation.goBack()}
    onDone={(equipmentType, reference, queued) =>
      navigation.popTo('EquipmentList', {
        toast: queued
          ? {
              title: 'Saved — will upload when back online',
              message:
                "This check-in is queued and will apply automatically once you're back online.",
              routeId: '',
              variant: 'danger',
            }
          : {
              title: 'Equipment checked in',
              message: `${equipmentType} ${reference} was checked in and removed from your list.`,
              routeId: '',
            },
      })
    }
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
    <Stack.Screen name="EquipmentCheckOut" component={CheckOutRoute} />
    <Stack.Screen name="EquipmentCheckIn" component={CheckInRoute} />
  </Stack.Navigator>
);

export default EquipmentNavigator;

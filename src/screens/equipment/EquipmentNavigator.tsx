import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {EquipmentStackParamList} from './routes';
import EquipmentScreen from './EquipmentScreen';
import CreateEquipmentScreen from './CreateEquipmentScreen';
import ViewEquipmentScreen from './ViewEquipmentScreen';
import CheckOutEquipmentScreen from './CheckOutEquipmentScreen';
import CheckInEquipmentScreen from './CheckInEquipmentScreen';
import AddUpkeepScreen from './AddUpkeepScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<EquipmentStackParamList>();

type CreateProps = NativeStackScreenProps<
  EquipmentStackParamList,
  'EquipmentCreate'
>;
type ViewProps = NativeStackScreenProps<EquipmentStackParamList, 'EquipmentView'>;
type CheckOutProps = NativeStackScreenProps<
  EquipmentStackParamList,
  'EquipmentCheckOut'
>;
type CheckInProps = NativeStackScreenProps<
  EquipmentStackParamList,
  'EquipmentCheckIn'
>;
type AddUpkeepProps = NativeStackScreenProps<
  EquipmentStackParamList,
  'EquipmentAddUpkeep'
>;

const CreateRoute: React.FC<CreateProps> = ({navigation}) => (
  <CreateEquipmentScreen
    onClose={() => navigation.popTo('EquipmentList')}
    onCreated={created =>
      navigation.popTo('EquipmentList', {
        toast: created.queued
          ? {
              title: 'Saved — will upload when back online',
              message:
                "This equipment is queued and will be added automatically once you're back online.",
              // The record has no server id yet, so there is nothing to open.
              routeId: '',
              variant: 'danger',
            }
          : {
              title: 'Equipment added',
              message: `${created.reference} was added to the equipment list.`,
              routeId: created.id,
            },
      })
    }
  />
);

const ViewRoute: React.FC<ViewProps> = ({navigation, route}) => (
  <ViewEquipmentScreen
    id={route.params.id}
    onClose={() => navigation.popTo('EquipmentList')}
    onCheckOut={() => navigation.navigate('EquipmentCheckOut', {id: route.params.id})}
    onCheckIn={() => navigation.navigate('EquipmentCheckIn', {id: route.params.id})}
    onAddUpkeep={() =>
      navigation.navigate('EquipmentAddUpkeep', {id: route.params.id, origin: 'detail'})
    }
  />
);

const CheckOutRoute: React.FC<CheckOutProps> = ({navigation, route}) => (
  <CheckOutEquipmentScreen
    id={route.params.id}
    onClose={() => navigation.goBack()}
    onDone={queued =>
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

const AddUpkeepRoute: React.FC<AddUpkeepProps> = ({navigation, route}) => (
  <AddUpkeepScreen
    id={route.params.id}
    onClose={() => navigation.goBack()}
    onDone={(equipmentType, reference, queued) => {
      if (queued) {
        navigation.popTo('EquipmentList', {
          toast: {
            title: 'Saved — will upload when back online',
            message:
              "This upkeep is queued and will apply automatically once you're back online.",
            routeId: '',
            variant: 'danger',
          },
        });
        return;
      }
      // Opened from the detail screen: switch it to the Upkeep tab instead
      // of surfacing a toast, matching the source mockup's behaviour.
      // Opened from a list card: there's no detail screen underneath to
      // switch tabs on, so pop to the list with the success toast instead.
      if (route.params.origin === 'detail') {
        navigation.popTo('EquipmentView', {id: route.params.id, initialTab: 'upkeep'});
        return;
      }
      navigation.popTo('EquipmentList', {
        toast: {
          title: 'Upkeep added',
          message: `Upkeep record saved for ${equipmentType} ${reference}.`,
          routeId: route.params.id,
        },
      });
    }}
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
    <Stack.Screen name="EquipmentCreate" component={CreateRoute} />
    <Stack.Screen name="EquipmentView" component={ViewRoute} />
    <Stack.Screen name="EquipmentCheckOut" component={CheckOutRoute} />
    <Stack.Screen name="EquipmentCheckIn" component={CheckInRoute} />
    <Stack.Screen name="EquipmentAddUpkeep" component={AddUpkeepRoute} />
  </Stack.Navigator>
);

export default EquipmentNavigator;

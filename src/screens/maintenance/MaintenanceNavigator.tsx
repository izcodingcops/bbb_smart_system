import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {MaintenanceStackParamList} from './routes';
import MaintenanceScreen from './MaintenanceScreen';
import CreateMaintenanceScreen from './CreateMaintenanceScreen';
import ViewMaintenanceScreen from './ViewMaintenanceScreen';
import {useHideTabBar} from '../../hooks/useHideTabBar';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<MaintenanceStackParamList>();

type CreateProps = NativeStackScreenProps<
  MaintenanceStackParamList,
  'MaintenanceCreate'
>;
type ViewProps = NativeStackScreenProps<
  MaintenanceStackParamList,
  'MaintenanceView'
>;

/**
 * Create and View still take onClose/onCreated/onDeleted callbacks, so these
 * adapters translate navigation into them rather than rewriting two working
 * screens. The forms stay unaware they live in a stack.
 */
const CreateRoute: React.FC<CreateProps> = ({navigation, route}) => {
  const origin = route.params?.origin;
  useHideTabBar();
  return (
    <CreateMaintenanceScreen
      onClose={() => {
        navigation.popTo('MaintenanceList');
        // Closed unsaved and the create was asked for from another tab, so the
        // trip into this module never really happened — go back where it
        // started from.
        if (origin) {
          navigation.getParent()?.navigate(origin as never);
        }
      }}
      onCreated={created => {
        // Submitting keeps them here: the toast's View action opens the new
        // record, which only exists on this tab.
        navigation.popTo('MaintenanceList', {
          toast: created.queued
            ? {
                title: 'Saved — will upload when back online',
                message:
                  "This request is queued and will upload automatically once you're back online.",
                routeId: '',
                variant: 'danger',
              }
            : {
                title: 'Maintenance submitted',
                message: `${created.reference} was added to your Work Log.`,
                routeId: created.id,
              },
        });
      }}
    />
  );
};

const ViewRoute: React.FC<ViewProps> = ({navigation, route}) => {
  useHideTabBar();
  return (
    <ViewMaintenanceScreen
      id={route.params.id}
      onClose={() => navigation.popTo('MaintenanceList')}
      onDeleted={reference => {
        navigation.popTo('MaintenanceList', {
          toast: {
            title: 'Maintenance deleted',
            message: `${reference} was removed from your Work Log.`,
            routeId: '',
            variant: 'danger',
          },
        });
      }}
    />
  );
};

const MaintenanceNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="MaintenanceList" component={MaintenanceScreen} />
    <Stack.Screen name="MaintenanceCreate" component={CreateRoute} />
    <Stack.Screen name="MaintenanceView" component={ViewRoute} />
  </Stack.Navigator>
);

export default MaintenanceNavigator;

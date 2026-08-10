import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {IncidentStackParamList} from './routes';
import IncidentScreen from './IncidentScreen';
import CreateIncidentScreen from './CreateIncidentScreen';
import ViewIncidentScreen from './ViewIncidentScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<IncidentStackParamList>();

type CreateProps = NativeStackScreenProps<
  IncidentStackParamList,
  'IncidentCreate'
>;
type ViewProps = NativeStackScreenProps<IncidentStackParamList, 'IncidentView'>;

/**
 * Create and View still take onClose/onCreated/onDeleted callbacks, so these
 * adapters translate navigation into them rather than rewriting two working
 * screens. The forms stay unaware they live in a stack.
 *
 * Note this stack's create route is the standalone one. Dispatch's Add
 * Incident flow renders CreateIncidentScreen itself with a
 * `dispatchReference`, and stays inside the Dispatch tab.
 */
const CreateRoute: React.FC<CreateProps> = ({navigation, route}) => {
  const origin = route.params?.origin;
  return (
    <CreateIncidentScreen
      onClose={() => {
        navigation.popTo('IncidentList');
        // Closed unsaved and the create was asked for from another tab, so the
        // trip into this module never really happened — go back where it
        // started from.
        if (origin) {
          navigation.getParent()?.navigate(origin as never);
        }
      }}
      onCreated={created => {
        navigation.popTo('IncidentList', {
          toast: created.queued
            ? {
                title: 'Saved — will upload when back online',
                message:
                  "This incident is queued and will upload automatically once you're back online.",
                routeId: '',
                variant: 'danger',
              }
            : {
                title: 'Incident submitted',
                message: `${created.reference} was added to your Work Log.`,
                routeId: created.id,
              },
        });
      }}
    />
  );
};

const ViewRoute: React.FC<ViewProps> = ({navigation, route}) => {
  return (
    <ViewIncidentScreen
      id={route.params.id}
      onClose={() => navigation.popTo('IncidentList')}
      onDeleted={reference => {
        navigation.popTo('IncidentList', {
          toast: {
            title: 'Incident deleted',
            message: `${reference} was removed from your Work Log.`,
            routeId: '',
            variant: 'danger',
          },
        });
      }}
    />
  );
};

const IncidentNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      // Every route here used to be local state inside one component — an
      // instant swap, no motion. The default push slide takes ~300ms, long
      // enough to see this stack's flat contentStyle before the destination
      // screen's own background (several use an SVG-gradient ScreenBackground
      // that needs a frame to paint) catches up — a visible gray flash that
      // never existed pre-navigation-stack. `animation: 'none'` restores the
      // original instant feel.
      animation: 'none',
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="IncidentList" component={IncidentScreen} />
    <Stack.Screen name="IncidentCreate" component={CreateRoute} />
    <Stack.Screen name="IncidentView" component={ViewRoute} />
  </Stack.Navigator>
);

export default IncidentNavigator;

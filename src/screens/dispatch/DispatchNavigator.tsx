import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {DispatchStackParamList} from './routes';
import DispatchScreen from './DispatchScreen';
import ViewDispatchScreen from './ViewDispatchScreen';
import CreateIncidentScreen from '../incident/CreateIncidentScreen';
import ViewIncidentScreen from '../incident/ViewIncidentScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<DispatchStackParamList>();

type AddIncidentProps = NativeStackScreenProps<
  DispatchStackParamList,
  'DispatchAddIncident'
>;
type ViewIncidentProps = NativeStackScreenProps<
  DispatchStackParamList,
  'DispatchViewIncident'
>;

/**
 * Add Incident and the incident detail sit on top of the dispatch detail
 * rather than replacing it, so that screen stays mounted underneath and keeps
 * its tab, "Newly Added" band and scroll position. Both hand their result back
 * to it as params.
 *
 * No explicit refetch on create — useCreateIncidentMutation includes
 * 'GetDispatch' in refetchQueries whenever a dispatchReference is passed, and
 * the dispatch detail underneath is the active 'GetDispatch' query.
 */
const AddIncidentRoute: React.FC<AddIncidentProps> = ({navigation, route}) => {
  const {dispatchId} = route.params;
  return (
    <CreateIncidentScreen
      dispatchReference={dispatchId}
      onClose={() => navigation.goBack()}
      onCreated={created => {
        navigation.popTo('DispatchView', {
          id: dispatchId,
          added: {
            id: created.id,
            queued: created.queued,
            reference: created.reference,
          },
        });
      }}
    />
  );
};

const ViewIncidentRoute: React.FC<ViewIncidentProps> = ({navigation, route}) => {
  const {id: incidentId, dispatchId} = route.params;
  return (
    <ViewIncidentScreen
      id={incidentId}
      onClose={() => navigation.goBack()}
      onDeleted={reference => {
        navigation.popTo('DispatchView', {
          id: dispatchId,
          deleted: {id: incidentId, reference},
        });
      }}
    />
  );
};

const DispatchNavigator: React.FC = () => (
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
    <Stack.Screen name="DispatchList" component={DispatchScreen} />
    <Stack.Screen name="DispatchView" component={ViewDispatchScreen} />
    <Stack.Screen name="DispatchAddIncident" component={AddIncidentRoute} />
    <Stack.Screen name="DispatchViewIncident" component={ViewIncidentRoute} />
  </Stack.Navigator>
);

export default DispatchNavigator;

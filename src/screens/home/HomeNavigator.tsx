import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {HomeStackParamList} from './routes';
import HomeScreen from './HomeScreen';
import NotificationsScreen from '../notifications/NotificationsScreen';
import ViewMaintenanceScreen from '../maintenance/ViewMaintenanceScreen';
import ViewIncidentScreen from '../incident/ViewIncidentScreen';
import ViewFixtureScreen from '../fixture/ViewFixtureScreen';
import ViewPoiScreen from '../poi/ViewPoiScreen';
import ViewWorkLogScreen from '../workLog/ViewWorkLogScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<HomeStackParamList>();

type NotificationsProps = NativeStackScreenProps<
  HomeStackParamList,
  'HomeNotifications'
>;
type RecordProps = NativeStackScreenProps<HomeStackParamList, 'HomeRecordView'>;

/**
 * NotificationsScreen still takes an onClose callback, so this adapter
 * translates navigation into it rather than rewriting a working screen.
 */
const NotificationsRoute: React.FC<NotificationsProps> = ({navigation}) => (
  <NotificationsScreen onClose={() => navigation.popTo('HomeMain')} />
);

/**
 * One route for every record type a notification can point at, discriminated
 * by `kind`, rather than five near-identical routes.
 *
 * These sit on top of Notifications in this stack, so back returns there and
 * the list keeps its scroll position and read/unread state. Deleting also just
 * pops back — the Notifications list holds no copy of the record to refresh,
 * and the owning module refetches from its own mutation.
 *
 * POI's detail additionally offers "add interaction/update", which belong to
 * the POI tab's own stack; they are not reachable from here, matching how the
 * Work tab renders these same detail screens without their sub-flows.
 */
const RecordRoute: React.FC<RecordProps> = ({navigation, route}) => {
  const {kind, id} = route.params;
  const onClose = () => navigation.popTo('HomeNotifications');

  switch (kind) {
    case 'Maintenance':
      return (
        <ViewMaintenanceScreen id={id} onClose={onClose} onDeleted={onClose} />
      );
    case 'Incident':
      return (
        <ViewIncidentScreen id={id} onClose={onClose} onDeleted={onClose} />
      );
    case 'Fixture':
      return (
        <ViewFixtureScreen id={id} onClose={onClose} onDeleted={onClose} />
      );
    case 'WorkLog':
      return (
        <ViewWorkLogScreen id={id} onClose={onClose} onDeleted={onClose} />
      );
    case 'Poi':
      return (
        <ViewPoiScreen
          id={id}
          onClose={onClose}
          onDeleted={onClose}
          onAddInteraction={onClose}
          onAddUpdate={onClose}
        />
      );
  }
};

const HomeNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="HomeNotifications" component={NotificationsRoute} />
    <Stack.Screen name="HomeRecordView" component={RecordRoute} />
  </Stack.Navigator>
);

export default HomeNavigator;

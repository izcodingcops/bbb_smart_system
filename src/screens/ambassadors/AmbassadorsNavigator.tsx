import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {AmbassadorsStackParamList} from './routes';
import AmbassadorsListScreen from './AmbassadorsListScreen';
import AmbassadorProfileScreen from './AmbassadorProfileScreen';
import AmbassadorWorkListScreen from './AmbassadorWorkListScreen';
import AmbassadorWorkViewScreen from './AmbassadorWorkViewScreen';
import AmbassadorReportsListScreen from './AmbassadorReportsListScreen';
import ViewObservationReportScreen from '../observationReports/ViewObservationReportScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<AmbassadorsStackParamList>();

type ReportViewProps = NativeStackScreenProps<
  AmbassadorsStackParamList,
  'AmbassadorsReportView'
>;

/**
 * Reuses Observation Reports' own detail screen verbatim rather than a copy —
 * `readOnly` suppresses its Edit/Delete, since this module drills into a
 * report as a read-only record. `onDeleted` is unreachable with no Delete
 * button to trigger it, but the prop is required by the shared screen.
 */
const ReportViewRoute: React.FC<ReportViewProps> = ({navigation, route}) => (
  <ViewObservationReportScreen
    id={route.params.id}
    readOnly
    onClose={() => navigation.goBack()}
    onDeleted={() => navigation.goBack()}
  />
);

const AmbassadorsNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'none',
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="AmbassadorsList" component={AmbassadorsListScreen} />
    <Stack.Screen name="AmbassadorsProfile" component={AmbassadorProfileScreen} />
    <Stack.Screen name="AmbassadorsWorkList" component={AmbassadorWorkListScreen} />
    <Stack.Screen name="AmbassadorsWorkView" component={AmbassadorWorkViewScreen} />
    <Stack.Screen name="AmbassadorsReportsList" component={AmbassadorReportsListScreen} />
    <Stack.Screen name="AmbassadorsReportView" component={ReportViewRoute} />
  </Stack.Navigator>
);

export default AmbassadorsNavigator;

import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {WorkStackParamList} from './routes';
import WorkScreen from './WorkScreen';
import CreateWorkLogScreen from '../workLog/CreateWorkLogScreen';
import ViewWorkLogScreen from '../workLog/ViewWorkLogScreen';
import ViewMaintenanceScreen from '../maintenance/ViewMaintenanceScreen';
import ViewFixtureScreen from '../fixture/ViewFixtureScreen';
import {workLogCopy} from '../workLog/shiftText';
import {useHideTabBar} from '../../hooks/useHideTabBar';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<WorkStackParamList>();

type CreateProps = NativeStackScreenProps<WorkStackParamList, 'WorkLogCreate'>;
type LogViewProps = NativeStackScreenProps<WorkStackParamList, 'WorkLogView'>;
type MaintenanceViewProps = NativeStackScreenProps<
  WorkStackParamList,
  'WorkMaintenanceView'
>;
type FixtureViewProps = NativeStackScreenProps<
  WorkStackParamList,
  'WorkFixtureView'
>;

/**
 * The detail and create screens still take onClose/onCreated/onDeleted
 * callbacks, so these adapters translate navigation into them rather than
 * rewriting four working screens.
 */
const CreateRoute: React.FC<CreateProps> = ({navigation, route}) => {
  const origin = route.params?.origin;
  useHideTabBar();
  return (
    <CreateWorkLogScreen
      onClose={() => {
        navigation.popTo('WorkList');
        // Closed unsaved and the create was asked for from another tab, so the
        // trip into this module never really happened — go back where it
        // started from.
        if (origin) {
          navigation.getParent()?.navigate(origin as never);
        }
      }}
      onCreated={created => {
        const copy = workLogCopy(created.shiftTypeName);
        navigation.popTo('WorkList', {
          toast: created.queued
            ? {
                title: copy.queuedToastTitle,
                message: copy.queuedToastMessage(created.entryType),
              }
            : {
                title: copy.toastTitle,
                message: copy.toastMessage(created.entryType),
              },
        });
      }}
    />
  );
};

const LogViewRoute: React.FC<LogViewProps> = ({navigation, route}) => {
  useHideTabBar();
  return (
    <ViewWorkLogScreen
      id={route.params.id}
      onClose={() => navigation.popTo('WorkList')}
      onDeleted={(reference, shiftTypeName) => {
        const copy = workLogCopy(shiftTypeName);
        navigation.popTo('WorkList', {
          refresh: true,
          toast: {
            title: copy.deletedToastTitle,
            message: copy.deletedToastMessage(reference),
            variant: 'danger',
          },
        });
      }}
    />
  );
};

const MaintenanceViewRoute: React.FC<MaintenanceViewProps> = ({
  navigation,
  route,
}) => {
  useHideTabBar();
  return (
    <ViewMaintenanceScreen
      id={route.params.id}
      onClose={() => navigation.popTo('WorkList')}
      onDeleted={reference => {
        navigation.popTo('WorkList', {
          refresh: true,
          toast: {
            title: 'Maintenance deleted',
            message: `${reference} was removed from your Work Log.`,
            variant: 'danger',
          },
        });
      }}
    />
  );
};

const FixtureViewRoute: React.FC<FixtureViewProps> = ({navigation, route}) => {
  useHideTabBar();
  return (
    <ViewFixtureScreen
      id={route.params.id}
      onClose={() => navigation.popTo('WorkList')}
      onDeleted={reference => {
        navigation.popTo('WorkList', {
          refresh: true,
          toast: {
            title: 'Fixture deleted',
            message: `${reference} was removed from your Work Log.`,
            variant: 'danger',
          },
        });
      }}
    />
  );
};

const WorkNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="WorkList" component={WorkScreen} />
    <Stack.Screen name="WorkLogCreate" component={CreateRoute} />
    <Stack.Screen name="WorkLogView" component={LogViewRoute} />
    <Stack.Screen name="WorkMaintenanceView" component={MaintenanceViewRoute} />
    <Stack.Screen name="WorkFixtureView" component={FixtureViewRoute} />
  </Stack.Navigator>
);

export default WorkNavigator;

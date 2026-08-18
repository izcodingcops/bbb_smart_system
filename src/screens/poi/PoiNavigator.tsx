import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {PoiStackParamList, PoiToast} from './routes';
import PoiScreen from './PoiScreen';
import CreatePoiScreen from './CreatePoiScreen';
import CreateInteractionScreen from './CreateInteractionScreen';
import CreateUpdateScreen from './CreateUpdateScreen';
import ViewPoiScreen from './ViewPoiScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<PoiStackParamList>();

type CreatePersonProps = NativeStackScreenProps<
  PoiStackParamList,
  'PoiCreatePerson'
>;
type CreateInteractionProps = NativeStackScreenProps<
  PoiStackParamList,
  'PoiCreateInteraction'
>;
type CreateUpdateProps = NativeStackScreenProps<
  PoiStackParamList,
  'PoiCreateUpdate'
>;
type ViewProps = NativeStackScreenProps<PoiStackParamList, 'PoiView'>;

/**
 * Shared by all three creates — only the noun and the View target differ.
 * Submitting keeps the user here: the toast's View action opens a record that
 * only exists on this tab.
 */
function createdToast(
  created: {id: string; reference: string; queued: boolean},
  noun: 'person' | 'interaction' | 'update',
  title: string,
  message: string,
): PoiToast {
  return created.queued
    ? {
        title: 'Saved — will upload when back online',
        message: `This ${noun} is queued and will upload automatically once you're back online.`,
        routeId: '',
        variant: 'danger',
      }
    : {title, message, routeId: created.id};
}

const CreatePersonRoute: React.FC<CreatePersonProps> = ({
  navigation,
  route,
}) => {
  const origin = route.params?.origin;
  return (
    <CreatePoiScreen
      onClose={() => {
        navigation.popTo('PoiList');
        // Closed unsaved and the create was asked for from another tab, so the
        // trip into this module never really happened — go back where it
        // started from.
        if (origin) {
          navigation.getParent()?.navigate(origin as never);
        }
      }}
      onCreated={created =>
        navigation.popTo('PoiList', {
          toast: createdToast(
            created,
            'person',
            'Person submitted',
            `${created.reference} was added to your Work Log.`,
          ),
        })
      }
    />
  );
};

const CreateInteractionRoute: React.FC<CreateInteractionProps> = ({
  navigation,
  route,
}) => {
  const {personId, personName} = route.params ?? {};
  return (
    <CreateInteractionScreen
      personId={personId}
      personName={personName}
      onClose={() => navigation.popTo('PoiList')}
      // `created.id` is the person's — an interaction has no screen of its
      // own, so View opens the person it was logged against.
      onCreated={created =>
        navigation.popTo('PoiList', {
          toast: createdToast(
            created,
            'interaction',
            'Interaction added',
            personName
              ? `${created.reference} was logged for ${personName}.`
              : `${created.reference} was logged.`,
          ),
        })
      }
    />
  );
};

const CreateUpdateRoute: React.FC<CreateUpdateProps> = ({
  navigation,
  route,
}) => {
  const {personId, personName} = route.params ?? {};
  return (
    <CreateUpdateScreen
      personId={personId}
      personName={personName}
      onClose={() => navigation.popTo('PoiList')}
      onCreated={created =>
        navigation.popTo('PoiList', {
          toast: createdToast(
            created,
            'update',
            'Update added',
            personName
              ? `${created.reference} was logged for ${personName}.`
              : `${created.reference} was logged.`,
          ),
        })
      }
    />
  );
};

const ViewRoute: React.FC<ViewProps> = ({navigation, route}) => {
  return (
    <ViewPoiScreen
      id={route.params.id}
      onClose={() => navigation.popTo('PoiList')}
      onDeleted={reference => {
        navigation.popTo('PoiList', {
          toast: {
            title: 'Person deleted',
            message: `${reference} was removed from the POI list.`,
            routeId: '',
            variant: 'danger',
          },
        });
      }}
      onAddInteraction={person =>
        navigation.navigate('PoiCreateInteraction', {
          personId: person.id,
          personName: person.name,
        })
      }
      onAddUpdate={person =>
        navigation.navigate('PoiCreateUpdate', {
          personId: person.id,
          personName: person.name,
        })
      }
    />
  );
};

const PoiNavigator: React.FC = () => (
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
    <Stack.Screen name="PoiList" component={PoiScreen} />
    <Stack.Screen name="PoiCreatePerson" component={CreatePersonRoute} />
    <Stack.Screen
      name="PoiCreateInteraction"
      component={CreateInteractionRoute}
    />
    <Stack.Screen name="PoiCreateUpdate" component={CreateUpdateRoute} />
    <Stack.Screen name="PoiView" component={ViewRoute} />
  </Stack.Navigator>
);

export default PoiNavigator;

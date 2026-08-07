import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {useRoute} from '@react-navigation/native';
import ScreenBackground from '../components/ScreenBackground';
import ErrorBoundary from '../components/ErrorBoundary';
import {useGetMenuItemsQuery} from '../graphql/features/navigation/hooks';
import {useAppDispatch, useAppSelector} from '../redux/store';
import {
  SetupIntent,
  clearPendingCreate,
  clearPendingRecord,
  clearPendingScreen,
  setSetupIntent,
} from '../redux/ui/slice';
import {SCREEN} from './screens';
import {endShift} from '../redux/shift/slice';
import {GetActiveProgram} from '../redux/auth/selectors';
import {fontFamilies} from '../constants/fonts';
import {MenuItem} from '../types/navigation';
import {theme} from '../theme';
import HomeNavigator from '../screens/home/HomeNavigator';
import MoreSheet from '../components/MoreSheet';
import {ConfirmDialog} from '../components/ui';
import {
  AlertTriangleIcon,
  CubeIcon,
  GridIcon,
  HandymanIcon,
  HomeIcon,
  WorkIcon,
} from '../components/icons';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import MaintenanceNavigator from '../screens/maintenance/MaintenanceNavigator';
import WorkNavigator from '../screens/work/WorkNavigator';
import FixtureNavigator from '../screens/fixture/FixtureNavigator';
import IncidentNavigator from '../screens/incident/IncidentNavigator';
import DispatchNavigator from '../screens/dispatch/DispatchNavigator';
import MapsNavigator from '../screens/maps/MapsNavigator';
import PoiScreen from '../screens/poi/PoiScreen';

const {LATO} = fontFamilies;

const Tab = createBottomTabNavigator();

const SCREEN_MAP: Record<string, React.ComponentType<any>> = {
  [SCREEN.home]: HomeNavigator,
  [SCREEN.work]: WorkNavigator,
  [SCREEN.maintenance]: MaintenanceNavigator,
  [SCREEN.fixture]: FixtureNavigator,
  [SCREEN.incident]: IncidentNavigator,
  [SCREEN.dispatch]: DispatchNavigator,
  [SCREEN.maps]: MapsNavigator,
  [SCREEN.poi]: PoiScreen,
};

/**
 * More rows that can't just navigate: changing either of these means ending
 * the running shift, which drops the app back into the setup flow. They are
 * menu entries without screens, so they are never registered as tab routes.
 */
const SETUP_INTENTS: Record<string, SetupIntent> = {
  ChangeProgram: 'program',
  ChangeShiftType: 'shift_type',
};

const INTENT_COPY: Record<SetupIntent, string> = {
  program: 'Switching programs',
  shift_type: 'Changing shift type',
};

type IconComponent = React.FC<{size?: number; color?: string}>;

/** Exact paths pulled from the Ambassador mockups' inline SVG symbols. */
const ICON_MAP: Record<string, IconComponent> = {
  home: HomeIcon,
  work: WorkIcon,
  maintenance: HandymanIcon,
  fixture: CubeIcon,
  incident: AlertTriangleIcon,
};

/**
 * Placeholder for a menu entry this build has no screen for. Reads its own
 * route name rather than taking a prop, so it can be registered with
 * `component=` like every other tab instead of an inline render callback that
 * would remount on each parent render.
 */
const ComingSoonTab: React.FC = () => {
  const route = useRoute();
  const {data: menuItems = []} = useGetMenuItemsQuery();
  const label =
    menuItems.find(item => item.screen_name === route.name)?.menu_name ??
    'Coming soon';
  return <ComingSoonScreen title={label} />;
};

/**
 * Each tab's component, wrapped in its own error boundary so one module
 * crashing leaves the rest of the app usable.
 *
 * Cached at module level because React Navigation identifies a screen by its
 * component type: building the wrapper during render would hand it a new type
 * every time and remount the whole tab, losing exactly the state this
 * navigator exists to preserve.
 */
const wrappedTabs = new Map<string, React.ComponentType>();

function tabComponent(screenName: string): React.ComponentType {
  const cached = wrappedTabs.get(screenName);
  if (cached) {
    return cached;
  }
  const Screen = SCREEN_MAP[screenName] ?? ComingSoonTab;
  const Wrapped: React.FC = () => (
    <ErrorBoundary label={screenName}>
      <Screen />
    </ErrorBoundary>
  );
  Wrapped.displayName = `Tab(${screenName})`;
  wrappedTabs.set(screenName, Wrapped);
  return Wrapped;
}

interface TabBarProps extends BottomTabBarProps {
  menuItems: MenuItem[];
}

/**
 * The tab bar from the Ambassador mockups — pill-shaped top, layered
 * background, upward shadow — driven by the navigator's own state rather than
 * by a `useState` screen name.
 *
 * It also owns the More sheet and the end-shift confirmation, because those
 * live in the bar, and (transitionally) the `pendingScreen` handoff: this is
 * the only component inside the tab navigator that holds its `navigation`
 * object. That effect goes away with the rest of the pending* machinery once
 * every module is a stack.
 */
const AppTabBar: React.FC<TabBarProps> = ({state, navigation, menuItems}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const tabBarHidden = useAppSelector(s => s.ui.tabBarHidden);
  const pendingScreen = useAppSelector(s => s.ui.pendingScreen);
  const program = GetActiveProgram();
  const [moreOpen, setMoreOpen] = useState(false);
  const [queuedIntent, setQueuedIntent] = useState<SetupIntent | null>(null);
  const [pendingIntent, setPendingIntent] = useState<SetupIntent | null>(null);

  const activeScreen = state.routes[state.index]?.name ?? '';
  const registered = new Set(state.routes.map(route => route.name));

  // Tab switches asked for from a screen rather than the tab bar: the trip out
  // to a module's create flow, the trip into a record a notification points at,
  // and the trip back when a form is closed unsaved. Opening the create or
  // detail route is left to the module — it owns those routes — but a request
  // naming a module this build has no screen for is dropped whole, so it can't
  // sit in the store and fire on the next unrelated tab switch.
  useEffect(() => {
    if (!pendingScreen) {
      return;
    }
    if (registered.has(pendingScreen)) {
      navigation.navigate(pendingScreen);
    } else {
      dispatch(clearPendingCreate());
      dispatch(clearPendingRecord());
    }
    dispatch(clearPendingScreen());
    // `registered` is derived fresh each render; depending on it would re-run
    // this on every render. The route set only changes when the menu does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, navigation, pendingScreen]);

  const handleMoreSelect = (screen: string) => {
    setMoreOpen(false);
    const intent = SETUP_INTENTS[screen];
    if (intent) {
      // Held until the sheet's modal is gone — see handleMoreClosed.
      setQueuedIntent(intent);
    } else if (registered.has(screen)) {
      navigation.navigate(screen);
    }
  };

  // iOS drops a modal presented while another is still up, so the confirm
  // dialog can only open once the sheet has actually finished dismissing.
  const handleMoreClosed = () => {
    if (queuedIntent) {
      setPendingIntent(queuedIntent);
      setQueuedIntent(null);
    }
  };

  // Ending the shift is what navigates: AppNavigator swaps to the setup flow
  // as soon as there's no active shift, and the intent picks the step.
  const handleEndShift = () => {
    if (pendingIntent) {
      dispatch(setSetupIntent(pendingIntent));
      dispatch(endShift());
      setPendingIntent(null);
    }
  };

  const bottomItems = menuItems.filter(item => item.position === 'bottom');
  const moreItems = menuItems.filter(item => item.position === 'more');
  const isMoreActive =
    moreOpen || moreItems.some(item => item.screen_name === activeScreen);

  // Rendered even while hidden so the pendingScreen effect above keeps running
  // for screens that hide the bar (a detail view opened from a notification).
  if (tabBarHidden) {
    return null;
  }

  return (
    <>
      {/* Tab bar — pill-shaped top, layered background, upward shadow */}
      <View
        style={{
          backgroundColor: '#F3F3F3',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          shadowColor: '#000000',
          shadowOffset: {width: 0, height: -8},
          shadowOpacity: 0.12,
          shadowRadius: 40,
          elevation: 16,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingHorizontal: 16,
        }}>
        <View style={{flexDirection: 'row'}}>
          {bottomItems.map(item => {
            const focused = activeScreen === item.screen_name;
            const Icon = ICON_MAP[item.menu_icon];
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => navigation.navigate(item.screen_name)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 6,
                  paddingBottom: 7,
                  paddingHorizontal: 4,
                }}>
                <View
                  style={{
                    width: 50,
                    height: 34,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: focused
                      ? theme.colors.primaryLight
                      : 'transparent',
                  }}>
                  {Icon ? (
                    <Icon size={22} color={focused ? '#0066B2' : '#696969'} />
                  ) : (
                    <View style={{width: 22, height: 22}} />
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{
                    fontFamily: focused ? LATO.bold : LATO.regular,
                    fontSize: 10,
                    lineHeight: 12,
                    color: focused ? '#0066B2' : '#696969',
                  }}>
                  {item.menu_name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {moreItems.length > 0 && (
            <TouchableOpacity
              onPress={() => setMoreOpen(true)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 6,
                paddingBottom: 7,
                paddingHorizontal: 8,
              }}>
              <View
                style={{
                  width: 50,
                  height: 34,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isMoreActive
                    ? theme.colors.primaryLight
                    : 'transparent',
                }}>
                <GridIcon
                  size={22}
                  color={isMoreActive ? '#0066B2' : '#696969'}
                />
              </View>
              <Text
                style={{
                  fontFamily: isMoreActive ? LATO.bold : LATO.regular,
                  fontSize: 10,
                  lineHeight: 12,
                  color: isMoreActive ? '#0066B2' : '#696969',
                }}>
                More
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <MoreSheet
        visible={moreOpen}
        items={moreItems}
        selected={activeScreen}
        onSelect={handleMoreSelect}
        onClose={() => setMoreOpen(false)}
        onClosed={handleMoreClosed}
      />

      <ConfirmDialog
        visible={pendingIntent !== null}
        title="End current shift?"
        message={
          pendingIntent ? (
            <Text>
              {INTENT_COPY[pendingIntent]} will end your current shift on{' '}
              <Text style={{fontFamily: LATO.black}}>
                {program?.name ?? 'this program'}
              </Text>
              . End the shift to continue?
            </Text>
          ) : null
        }
        confirmLabel="End Shift"
        onConfirm={handleEndShift}
        onCancel={() => setPendingIntent(null)}
      />
    </>
  );
};

const MainTabNavigator: React.FC = () => {
  const {data: menuItems = [], isLoading} = useGetMenuItemsQuery();

  // Briefly on show while the menu loads after a shift starts, so it uses the
  // app's background and type rather than bare text on white.
  if (isLoading || menuItems.length === 0) {
    return (
      <ScreenBackground style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Getting things ready…</Text>
      </ScreenBackground>
    );
  }

  // Setup-intent rows are actions, not destinations — they stay in the More
  // sheet but never become routes.
  const routableItems = menuItems.filter(item => !SETUP_INTENTS[item.screen_name]);
  const initialRouteName = (
    routableItems.find(item => item.position === 'bottom') ?? routableItems[0]
  )?.screen_name;

  return (
    <SafeAreaView
      edges={[]}
      style={{flex: 1, backgroundColor: theme.colors.background}}>
      <Tab.Navigator
        initialRouteName={initialRouteName}
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          sceneStyle: {backgroundColor: theme.colors.background},
        }}
        // `tabBar` is a render prop, not a screen component — React Navigation
        // calls it in place each render and the element type it returns is
        // stable, so nothing remounts. The rule can't tell the two apart.
        // eslint-disable-next-line react/no-unstable-nested-components
        tabBar={props => <AppTabBar {...props} menuItems={menuItems} />}>
        {routableItems.map(item => (
          <Tab.Screen
            key={item.id}
            name={item.screen_name}
            component={tabComponent(item.screen_name)}
          />
        ))}
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingRoot: {alignItems: 'center', justifyContent: 'center'},
  loadingText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14.5,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
});

export default MainTabNavigator;

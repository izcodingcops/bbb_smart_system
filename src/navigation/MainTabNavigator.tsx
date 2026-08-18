import React, {useState} from 'react';
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
import {getFocusedRouteNameFromRoute, useRoute} from '@react-navigation/native';
import ScreenBackground from '../components/ScreenBackground';
import ErrorBoundary from '../components/ErrorBoundary';
import {useGetMenuItemsQuery} from '../graphql/features/navigation/hooks';
import {useAppDispatch} from '../redux/store';
import {SetupIntent, setSetupIntent} from '../redux/ui/slice';
import {SCREEN, TAB_ROOT_ROUTE} from './screens';
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
  GridIcon,
  HandymanIcon,
  HomeIcon,
  UserPlusIcon,
  WorkIcon,
} from '../components/icons';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import MaintenanceNavigator from '../screens/maintenance/MaintenanceNavigator';
import WorkNavigator from '../screens/work/WorkNavigator';
import FixtureNavigator from '../screens/fixture/FixtureNavigator';
import IncidentNavigator from '../screens/incident/IncidentNavigator';
import DispatchNavigator from '../screens/dispatch/DispatchNavigator';
import EquipmentNavigator from '../screens/equipment/EquipmentNavigator';
import MapsNavigator from '../screens/maps/MapsNavigator';
import PoiNavigator from '../screens/poi/PoiNavigator';
import ObservationReportsNavigator from '../screens/observationReports/ObservationReportsNavigator';
import ReferenceDocumentsNavigator from '../screens/referenceDocuments/ReferenceDocumentsNavigator';
import RvpSiteVisitNavigator from '../screens/rvpSiteVisit/RvpSiteVisitNavigator';

const {LATO} = fontFamilies;

const Tab = createBottomTabNavigator();

const SCREEN_MAP: Record<string, React.ComponentType<any>> = {
  [SCREEN.home]: HomeNavigator,
  [SCREEN.work]: WorkNavigator,
  [SCREEN.maintenance]: MaintenanceNavigator,
  [SCREEN.fixture]: FixtureNavigator,
  [SCREEN.incident]: IncidentNavigator,
  [SCREEN.dispatch]: DispatchNavigator,
  [SCREEN.equipment]: EquipmentNavigator,
  [SCREEN.maps]: MapsNavigator,
  [SCREEN.poi]: PoiNavigator,
  [SCREEN.reports]: ObservationReportsNavigator,
  [SCREEN.referenceDocuments]: ReferenceDocumentsNavigator,
  [SCREEN.rvpSiteVisit]: RvpSiteVisitNavigator,
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
  poi: UserPlusIcon,
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
 * live in the bar.
 */
const AppTabBar: React.FC<TabBarProps> = ({state, navigation, menuItems}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const program = GetActiveProgram();
  const [moreOpen, setMoreOpen] = useState(false);
  const [queuedIntent, setQueuedIntent] = useState<SetupIntent | null>(null);
  const [pendingIntent, setPendingIntent] = useState<SetupIntent | null>(null);

  const activeRoute = state.routes[state.index];
  const activeScreen = activeRoute?.name ?? '';
  const registered = new Set(state.routes.map(route => route.name));

  /**
   * Hidden whenever the focused tab has pushed past its stack's first route —
   * anything above it is a full-screen create or detail with no place for the
   * bar.
   *
   * Read from navigator state rather than a redux flag written by each
   * screen's focus effect. Those effects raced across navigators: jumping to
   * another tab's detail fired the incoming screen's "hide" before the
   * outgoing screen's "show" cleanup, so the bar came back over a detail.
   *
   * `getFocusedRouteNameFromRoute` and not `route.state.index`, because a tab
   * that has not been mounted yet has no state to index into — it carries the
   * pending navigation in `params` instead. Reading the index alone worked for
   * bottom tabs (already visited, so state existed) and silently failed for
   * every tab reached from the More sheet. This helper covers both, and
   * returns undefined while a stack is still on its first route.
   */
  const focusedRoute = activeRoute
    ? getFocusedRouteNameFromRoute(activeRoute)
    : undefined;
  const onPushedRoute =
    focusedRoute != null && focusedRoute !== TAB_ROOT_ROUTE[activeScreen];

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

  if (onPushedRoute) {
    return null;
  }

  return (
    <>
      {/* Tab bar — pill-shaped top, glass fill, upward shadow.
       *  The design's own shadow points downward (off-screen for a bottom
       *  bar), so separation there comes from the fill and border alone. This
       *  bar isn't floating, so it keeps an upward shadow to lift itself off
       *  scrolling content — same list-shadow API as the glass surfaces. */}
      <View
        style={{
          backgroundColor: theme.glass.navFill,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderTopWidth: 1,
          borderTopColor: theme.glass.navBorder,
          boxShadow: '0px -6px 24px 0px rgba(16,24,40,0.10)',
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
                      ? theme.colors.accentTint
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
                    ? theme.colors.accentTint
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
      style={{flex: 1, backgroundColor: theme.glass.navBackdrop}}>
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

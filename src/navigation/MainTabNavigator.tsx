import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import ScreenBackground from '../components/ScreenBackground';
import {useGetMenuItemsQuery} from '../graphql/features/navigation/hooks';
import {useAppDispatch, useAppSelector} from '../redux/store';
import {
  SetupIntent,
  clearPendingCreate,
  clearPendingScreen,
  setSetupIntent,
} from '../redux/ui/slice';
import {SCREEN} from './screens';
import {endShift} from '../redux/shift/slice';
import {GetActiveProgram} from '../redux/auth/selectors';
import {fontFamilies} from '../constants/fonts';
import {theme} from '../theme';
import HomeScreen from '../screens/home/HomeScreen';
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
import MaintenanceScreen from '../screens/maintenance/MaintenanceScreen';
import WorkScreen from '../screens/work/WorkScreen';
import FixtureScreen from '../screens/fixture/FixtureScreen';
import IncidentScreen from '../screens/incident/IncidentScreen';
import DispatchScreen from '../screens/dispatch/DispatchScreen';
import MapsScreen from '../screens/maps/MapsScreen';
import PoiScreen from '../screens/poi/PoiScreen';

const {LATO} = fontFamilies;

const SCREEN_MAP: Record<string, React.ComponentType<any>> = {
  [SCREEN.home]: HomeScreen,
  [SCREEN.work]: WorkScreen,
  [SCREEN.maintenance]: MaintenanceScreen,
  [SCREEN.fixture]: FixtureScreen,
  [SCREEN.incident]: IncidentScreen,
  [SCREEN.dispatch]: DispatchScreen,
  [SCREEN.maps]: MapsScreen,
  [SCREEN.poi]: PoiScreen,
};

/**
 * More rows that can't just navigate: changing either of these means ending
 * the running shift, which drops the app back into the setup flow.
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

const MainTabNavigator: React.FC = () => {
  const {data: menuItems = [], isLoading} = useGetMenuItemsQuery();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const tabBarHidden = useAppSelector(state => state.ui.tabBarHidden);
  const pendingScreen = useAppSelector(state => state.ui.pendingScreen);
  const program = GetActiveProgram();
  const [activeScreen, setActiveScreen] = useState<string>('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [queuedIntent, setQueuedIntent] = useState<SetupIntent | null>(null);
  const [pendingIntent, setPendingIntent] = useState<SetupIntent | null>(null);

  const handleMoreSelect = (screen: string) => {
    setMoreOpen(false);
    const intent = SETUP_INTENTS[screen];
    if (intent) {
      // Held until the sheet's modal is gone — see handleMoreClosed.
      setQueuedIntent(intent);
    } else {
      setActiveScreen(screen);
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

  // Tab switches asked for from a screen rather than the tab bar: the trip out
  // to a module's create flow, and the trip back when that form is closed
  // unsaved. Opening create is left to the module — it owns that route — but a
  // request naming a module this build has no screen for is dropped whole.
  useEffect(() => {
    if (!pendingScreen) return;
    if (SCREEN_MAP[pendingScreen]) {
      setActiveScreen(pendingScreen);
    } else {
      dispatch(clearPendingCreate());
    }
    dispatch(clearPendingScreen());
  }, [dispatch, pendingScreen]);

  useEffect(() => {
    if (menuItems.length > 0 && !activeScreen) {
      const first = menuItems.find(i => i.position === 'bottom') ?? menuItems[0];
      if (first) setActiveScreen(first.screen_name);
    }
  }, [menuItems, activeScreen]);

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

  const bottomItems = menuItems.filter(i => i.position === 'bottom');
  const moreItems = menuItems.filter(i => i.position === 'more');
  const isMoreActive =
    moreOpen || moreItems.some(i => i.screen_name === activeScreen);

  const renderContent = () => {
    const ActiveScreen = SCREEN_MAP[activeScreen];
    if (!ActiveScreen) {
      // Menu entry without a screen yet — show a placeholder rather than Home.
      const label =
        menuItems.find(i => i.screen_name === activeScreen)?.menu_name ??
        'Coming soon';
      return <ComingSoonScreen title={label} />;
    }
    return <ActiveScreen />;
  };

  return (
    <SafeAreaView
      edges={[]}
      style={{flex: 1, backgroundColor: theme.colors.background}}>
      <View style={{flex: 1}}>{renderContent()}</View>

      {!tabBarHidden && (
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
              onPress={() => setActiveScreen(item.screen_name)}
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
              <GridIcon size={22} color={isMoreActive ? '#0066B2' : '#696969'} />
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
        </>
      )}

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

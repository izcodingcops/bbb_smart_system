import React, {useEffect, useState} from 'react';
import {Text, TouchableOpacity, View, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppDispatch} from '../redux/store';
import {GetMenuItems, GetMenuLoading} from '../redux/navigation/selectors';
import {requestMenuList} from '../redux/navigation/actions';
import {fontFamilies} from '../constants/fonts';
import {locationTracker} from '../utils/locationTracker';
import HomeScreen from '../screens/HomeScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import FixtureScreen from '../screens/FixtureScreen';
import IncidentScreen from '../screens/IncidentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MoreScreen from '../screens/MoreScreen';

const {LATO} = fontFamilies;

const SCREEN_MAP: Record<string, React.ComponentType<any>> = {
  Home: HomeScreen,
  Maintenance: MaintenanceScreen,
  Fixture: FixtureScreen,
  Incident: IncidentScreen,
  Profile: ProfileScreen,
};

const ICON_MAP: Record<string, any> = {
  home: require('../assets/icons/tab_home.png'),
  maintenance: require('../assets/icons/tab_maintenance.png'),
  fixture: require('../assets/icons/tab_fixture.png'),
  incident: require('../assets/icons/tab_incident.png'),
  profile: require('../assets/icons/tab_profile.png'),
};

const MORE_SCREEN = '__more__';

const MainTabNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const menuItems = GetMenuItems();
  const isLoading = GetMenuLoading();
  const [activeScreen, setActiveScreen] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showBar, setShowBar] = useState<boolean>(false);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    locationTracker.getConnectivityStatus().then(online => {
      if (!mounted) return;
      setIsOnline(online);
      setShowBar(!online);
    });
    const unsub = locationTracker.onConnectivityChange(online => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setIsOnline(online);
      if (!online) {
        setShowBar(true);
      } else {
        setShowBar(true);
        hideTimer.current = setTimeout(() => setShowBar(false), 3000);
      }
    });
    return () => {
      mounted = false;
      unsub();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    if (menuItems.length === 0) {
      dispatch(requestMenuList());
    }
  }, [dispatch, menuItems.length]);

  useEffect(() => {
    if (menuItems.length > 0 && !activeScreen) {
      const first = menuItems.find(i => i.position === 'bottom') ?? menuItems[0];
      if (first) setActiveScreen(first.screen_name);
    }
  }, [menuItems, activeScreen]);

  if (isLoading || menuItems.length === 0) {
    return (
      <View style={{flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{color: '#9CA3AF'}}>Loading...</Text>
      </View>
    );
  }

  const bottomItems = menuItems.filter(i => i.position === 'bottom');
  const moreItems = menuItems.filter(i => i.position === 'more');
  const isMoreActive =
    activeScreen === MORE_SCREEN ||
    moreItems.some(i => i.screen_name === activeScreen);

  const renderContent = () => {
    if (isMoreActive && activeScreen === MORE_SCREEN) {
      return (
        <MoreScreen
          items={moreItems}
          onSelect={screen => setActiveScreen(screen)}
        />
      );
    }
    const ActiveScreen = SCREEN_MAP[activeScreen] ?? HomeScreen;
    return <ActiveScreen />;
  };

  return (
    <SafeAreaView edges={['bottom']} style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      <View style={{flex: 1}}>{renderContent()}</View>

      {/* Online / offline status strip */}
      {showBar && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 5,
            backgroundColor: isOnline ? '#ECFDF5' : '#FEF2F2',
          }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: isOnline ? '#10B981' : '#EF4444',
            }}
          />
          <Text
            style={{
              fontFamily: LATO.regular,
              fontSize: 11,
              color: isOnline ? '#065F46' : '#991B1B',
            }}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      )}

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
          paddingBottom: 8,
          paddingHorizontal: 16,
        }}>
        <View style={{flexDirection: 'row'}}>
        {bottomItems.map(item => {
          const focused = activeScreen === item.screen_name;
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
              {ICON_MAP[item.menu_icon] ? (
                <Image
                  source={ICON_MAP[item.menu_icon]}
                  style={{
                    width: 22,
                    height: 22,
                    tintColor: focused ? '#0066B2' : '#696969',
                  }}
                />
              ) : (
                <View style={{width: 22, height: 22}} />
              )}
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
            onPress={() => setActiveScreen(MORE_SCREEN)}
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
                width: 22,
                height: 22,
                justifyContent: 'center',
                gap: 3,
              }}>
              {[0, 1, 2].map(i => (
                <View
                  key={i}
                  style={{
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: isMoreActive ? '#0066B2' : '#696969',
                  }}
                />
              ))}
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
    </SafeAreaView>
  );
};

export default MainTabNavigator;

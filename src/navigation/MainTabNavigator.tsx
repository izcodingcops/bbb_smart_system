import React, {useEffect, useState} from 'react';
import {Text, TouchableOpacity, View, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppDispatch} from '../redux/store';
import {fontFamilies} from '../constants/fonts';

const {LATO} = fontFamilies;
import {GetMenuItems, GetMenuLoading} from '../redux/navigation/selectors';
import {requestMenuList} from '../redux/navigation/actions';
import HomeScreen from '../screens/HomeScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import FixtureScreen from '../screens/FixtureScreen';
import IncidentScreen from '../screens/IncidentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MoreScreen from '../screens/MoreScreen';

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

  useEffect(() => {
    dispatch(requestMenuList());
  }, [dispatch]);

  useEffect(() => {
    if (menuItems.length > 0 && !activeScreen) {
      const first = menuItems.find(i => i.position === 'bottom');
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
    const ActiveScreen = SCREEN_MAP[activeScreen];
    return ActiveScreen ? <ActiveScreen /> : null;
  };

  return (
    <SafeAreaView edges={['bottom']} style={{flex: 1, backgroundColor: '#F7F7F7'}}>
      <View style={{flex: 1}}>{renderContent()}</View>

      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#F7F7F7',
          shadowColor: '#000',
          shadowOffset: {width: 0, height: -4},
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 12,
          height: 62,
          paddingTop: 6,
          paddingBottom: 7,
          paddingHorizontal: 8,
        }}>
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
                paddingHorizontal: 8,
              }}>
              {ICON_MAP[item.menu_icon] ? (
                <Image
                  source={ICON_MAP[item.menu_icon]}
                  style={{
                    width: 18,
                    height: 18,
                    tintColor: focused ? '#0066B2' : '#696969',
                  }}
                />
              ) : (
                <View style={{width: 18, height: 18}} />
              )}
              <Text
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
                width: 18,
                height: 18,
                justifyContent: 'center',
                gap: 3,
              }}>
              {[0, 1, 2].map(i => (
                <View
                  key={i}
                  style={{
                    height: 1.5,
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
    </SafeAreaView>
  );
};

export default MainTabNavigator;

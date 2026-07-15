import React, {useEffect, useState} from 'react';
import {Text, TouchableOpacity, View, Image} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useGetMenuItemsQuery} from '../redux/navigation/api';
import {useAppSelector} from '../redux/store';
import {fontFamilies} from '../constants/fonts';
import {theme} from '../theme';
import HomeScreen from '../screens/HomeScreen';
import MoreScreen from '../screens/MoreScreen';

const {LATO} = fontFamilies;

const SCREEN_MAP: Record<string, React.ComponentType<any>> = {
  Home: HomeScreen,
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
  const {data: menuItems = [], isLoading} = useGetMenuItemsQuery();
  const insets = useSafeAreaInsets();
  const tabBarHidden = useAppSelector(state => state.ui.tabBarHidden);
  const [activeScreen, setActiveScreen] = useState<string>('');

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
        </>
      )}
    </SafeAreaView>
  );
};

export default MainTabNavigator;

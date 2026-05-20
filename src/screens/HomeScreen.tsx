import React from 'react';
import {View, Text, TouchableOpacity, TextInput, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {GetSelectedProgram} from '../redux/program/selectors';
import {fontFamilies} from '../constants/fonts';

const {LATO} = fontFamilies;
const BLUE = '#0066B2';

const STAT_ICONS: Record<string, any> = {
  assigned: require('../assets/icons/stat_assigned.png'),
  unassign: require('../assets/icons/stat_unassign.png'),
  mywork: require('../assets/icons/stat_mywork.png'),
};

const StatCard = ({
  label,
  count,
  iconKey,
}: {
  label: string;
  count: number;
  iconKey: string;
}) => (
  <View className="flex-1 bg-white rounded-xl border border-[rgba(186,186,186,0.25)] p-3 gap-4">
    <Text
      className="text-xs text-[#656565]"
      style={{fontFamily: LATO.medium}}
      numberOfLines={1}>
      {label}
    </Text>
    <View className="flex-row justify-between items-center">
      <Text className="text-base text-[#3B3B3B]" style={{fontFamily: LATO.bold}}>
        {count}
      </Text>
      <Image source={STAT_ICONS[iconKey]} className="w-5 h-5" />
    </View>
  </View>
);

const HomeScreen: React.FC = () => {
  const selectedProgram = GetSelectedProgram();

  return (
    <View className="flex-1 bg-[#0066B2]">
      <SafeAreaView className="bg-[#0066B2] pb-4" edges={['top']}>
        <View className="flex-row items-center px-4 gap-8">
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-1">
              <Image
                source={require('../assets/icons/marker_pin.png')}
                className="w-5 h-5"
                style={{tintColor: '#FFFFFF'}}
              />
              <Text
                className="flex-1 text-white text-xl"
                style={{fontFamily: LATO.bold, lineHeight: 24}}
                numberOfLines={1}>
                {selectedProgram?.program_name ??
                  'Akron Oh Downtown Akron Partnership 1350'}
              </Text>
            </View>
            <View className="flex-row items-center gap-1 pl-6">
              <Text
                className="text-[#ECECEC] text-xs"
                style={{fontFamily: LATO.regular}}>
                Shift Type:
              </Text>
              <Text
                className="text-[#ECECEC] text-xs"
                style={{fontFamily: LATO.regular}}>
                Cleaning
              </Text>
              <Image
                source={require('../assets/icons/chevron_left.png')}
                className="w-3.5 h-3.5"
                style={{tintColor: '#FFFFFF'}}
              />
            </View>
          </View>

          <View className="w-[50px] h-[50px] rounded-lg bg-white/20 overflow-hidden items-center justify-center">
            <View className="absolute w-10 h-px bg-white/30 top-[17px]" />
            <View className="absolute w-px h-10 bg-white/30 left-[17px]" />
            <View className="w-2 h-2 rounded-full bg-white/80 mb-1" />
          </View>
        </View>

        <View
          className="flex-row items-center mx-4 mt-3 px-3 py-[9px] bg-white/30 rounded-xl border border-white/30"
          style={{
            gap: 10,
            shadowColor: '#0064AF',
            shadowOffset: {width: 0, height: 0},
            shadowOpacity: 1,
            shadowRadius: 6,
            elevation: 4,
          }}>
          <Image
            source={require('../assets/icons/search.png')}
            className="w-5 h-5"
            style={{tintColor: '#FFFFFF'}}
          />
          <TextInput
            className="flex-1 text-white text-base p-0"
            style={{fontFamily: LATO.medium, lineHeight: 24}}
            placeholder="Search here..."
            placeholderTextColor="rgba(255,255,255,0.7)"
          />
        </View>
      </SafeAreaView>

      <View className="flex-1 bg-[#F7F7F7] rounded-t-2xl">
        <View className="flex-row gap-2 px-4 pt-4">
          <StatCard label="Assigned Work" count={0} iconKey="assigned" />
          <StatCard label="Unassign Work" count={0} iconKey="unassign" />
          <StatCard label="My Work" count={0} iconKey="mywork" />
        </View>

        <View className="h-px bg-[#DEDEDE] mx-4 mt-[10px]" />

        <View className="items-center px-4 pt-10 gap-6">
          <Image
            source={require('../assets/icons/empty_icon.png')}
            className="w-[60px] h-[60px]"
          />
          <View className="items-center gap-2.5">
            <Text
              className="text-[#1A1A1A] text-xl text-center"
              style={{fontFamily: LATO.bold, lineHeight: 22}}>
              No work to show yet
            </Text>
            <Text
              className="text-[#667085] text-sm text-center"
              style={{fontFamily: LATO.medium, lineHeight: 18}}>
              Work appears when assigned by your supervisor, requested by a
              user, or created by you as needed.
            </Text>
          </View>
        </View>
      </View>

      {/* Location FAB */}
      <TouchableOpacity
        className="absolute right-4 bottom-[100px] flex-row items-center px-3 py-3 bg-[rgba(0,102,178,0.08)] rounded-2xl"
        style={{
          gap: 10,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
        activeOpacity={0.8}>
        <Image
          source={require('../assets/icons/map.png')}
          className="w-5 h-5"
          style={{tintColor: BLUE}}
        />
        <Text
          className="text-base text-[#0066B2]"
          style={{fontFamily: LATO.bold, lineHeight: 20}}>
          Location
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

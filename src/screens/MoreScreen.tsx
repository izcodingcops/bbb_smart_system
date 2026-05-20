import React from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MenuItem} from '../types/navigation';

const ICON_MAP: Record<string, string> = {
  home: '⌂',
  maintenance: '✂',
  fixture: '⋈',
  incident: 'ⓘ',
  profile: '⊙',
};

interface MoreScreenProps {
  items: MenuItem[];
  onSelect: (screen: string) => void;
}

const MoreScreen: React.FC<MoreScreenProps> = ({items, onSelect}) => {
  return (
    <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: '#F3F4F6'}}>
      <View style={{paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8}}>
        <Text style={{fontSize: 22, fontWeight: '700', color: '#111827'}}>
          More
        </Text>
      </View>

      <ScrollView contentContainerStyle={{padding: 16}}>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            overflow: 'hidden',
          }}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelect(item.screen_name)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: index < items.length - 1 ? 1 : 0,
                borderBottomColor: '#F3F4F6',
              }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  backgroundColor: '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}>
                <Text style={{fontSize: 18, color: '#1D4889'}}>
                  {ICON_MAP[item.menu_icon] ?? '○'}
                </Text>
              </View>
              <Text
                style={{flex: 1, fontSize: 15, fontWeight: '500', color: '#111827'}}>
                {item.menu_name}
              </Text>
              <Text style={{fontSize: 18, color: '#9CA3AF'}}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MoreScreen;

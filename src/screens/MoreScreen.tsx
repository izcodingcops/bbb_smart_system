import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MenuItem } from '../types/navigation';
import { locationTracker, SmoothingFilter } from '../utils/locationTracker';

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

const MoreScreen: React.FC<MoreScreenProps> = ({ items, onSelect }) => {
  const [filter, setFilter] = useState<SmoothingFilter>('gaussian');

  useEffect(() => {
    locationTracker.getSmoothingFilter().then(setFilter);
  }, []);

  const selectFilter = (value: SmoothingFilter) => {
    setFilter(value);
    locationTracker.setSmoothingFilter(value);
  };

  const handleShareGpsLog = async () => {
    const ok = await locationTracker.shareGpsLog();
    if (!ok) {
      Alert.alert('No GPS log', 'No GPS log file has been recorded yet.');
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: '#F3F4F6' }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>
          More
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
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
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  backgroundColor: '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Text style={{ fontSize: 18, color: '#1D4889' }}>
                  {ICON_MAP[item.menu_icon] ?? '○'}
                </Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: '500',
                  color: '#111827',
                }}
              >
                {item.menu_name}
              </Text>
              <Text style={{ fontSize: 18, color: '#9CA3AF' }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: '#9CA3AF',
            marginTop: 24,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          DEBUG
        </Text>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <TouchableOpacity
            onPress={handleShareGpsLog}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                backgroundColor: '#EFF6FF',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Text style={{ fontSize: 18, color: '#1D4889' }}>⇪</Text>
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                fontWeight: '500',
                color: '#111827',
              }}
            >
              Share GPS Log
            </Text>
            <Text style={{ fontSize: 18, color: '#9CA3AF' }}>›</Text>
          </TouchableOpacity>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderTopColor: '#F3F4F6',
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                fontWeight: '500',
                color: '#111827',
              }}
            >
              GPS Smoothing
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['gaussian', 'kalman', 'none'] as SmoothingFilter[]).map(value => {
                const selected = filter === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => selectFilter(value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: selected ? '#1D4889' : '#EFF6FF',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: selected ? '#fff' : '#1D4889',
                        textTransform: 'capitalize',
                      }}
                    >
                      {value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MoreScreen;

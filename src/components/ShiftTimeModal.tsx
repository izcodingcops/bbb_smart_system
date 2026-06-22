import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import BottomSheet from './BottomSheet';

interface Props {
  visible: boolean;
  isLoading: boolean;
  onConfirm: (startTime: Date, endTime: Date) => void;
  onClose: () => void;
  timeZone?: string;
}

const formatTime = (date: Date, timeZone?: string): string =>
  date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone,
  });

const formatDate = (date: Date, timeZone?: string): string =>
  date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  });

const ShiftTimeModal: React.FC<Props> = ({
  visible,
  isLoading,
  onConfirm,
  onClose,
  timeZone,
}) => {
  const [startTime] = useState(() => new Date());
  const [endTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 8);
    return d;
  });

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F0',
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>
          Shift Hours
        </Text>
        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
          <Text style={{ fontSize: 18, color: '#9CA3AF', fontWeight: '600' }}>
            ✕
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: '#F0F5FF',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#DBEAFE',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: '#3B82F6',
                fontWeight: '600',
                marginBottom: 4,
              }}
            >
              START TIME
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1D4889' }}>
              {formatTime(startTime, timeZone)}
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              {formatDate(startTime, timeZone)}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: '#F0FFF4',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#BBF7D0',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: '#16A34A',
                fontWeight: '600',
                marginBottom: 4,
              }}
            >
              END TIME
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#15803D' }}>
              {formatTime(endTime, timeZone)}
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              {formatDate(endTime, timeZone)}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
          8-hour shift starting now
        </Text>

        <TouchableOpacity
          onPress={() => onConfirm(startTime, endTime)}
          disabled={isLoading}
          style={{
            backgroundColor: '#1D4889',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              Start Shift
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

export default ShiftTimeModal;

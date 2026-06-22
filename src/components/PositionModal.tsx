import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { TaskItem } from '../types/program';
import BottomSheet from './BottomSheet';

interface Props {
  visible: boolean;
  tasks: TaskItem[];
  isLoading: boolean;
  programName: string;
  onSelect: (task: TaskItem) => void;
  onClose: () => void;
}

const PositionModal: React.FC<Props> = ({
  visible,
  tasks,
  isLoading,
  programName,
  onSelect,
  onClose,
}) => (
  <BottomSheet
    visible={visible}
    onClose={onClose}
    sheetStyle={{ maxHeight: '70%' }}
  >
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
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>
          Select Position
        </Text>
        <Text
          style={{ fontSize: 13, color: '#667085', marginTop: 2 }}
          numberOfLines={1}
        >
          {programName}
        </Text>
      </View>
      <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
        <Text style={{ fontSize: 18, color: '#9CA3AF', fontWeight: '600' }}>
          ✕
        </Text>
      </TouchableOpacity>
    </View>

    {isLoading ? (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1D4889" />
        <Text style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14 }}>
          Loading positions…
        </Text>
      </View>
    ) : (
      <FlatList
        data={tasks}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelect(item)}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 8,
              backgroundColor: '#F7F9FC',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 15, color: '#1A1A1A', fontWeight: '500' }}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
              No positions available
            </Text>
          </View>
        }
      />
    )}
  </BottomSheet>
);

export default PositionModal;

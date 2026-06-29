import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {TaskItem} from '../types/program';
import BottomSheet from './BottomSheet';
import {theme} from '../theme';

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
  <BottomSheet visible={visible} onClose={onClose} sheetStyle={{maxHeight: '70%'}}>
    <View style={styles.header}>
      <View style={theme.common.flex1}>
        <Text style={styles.title}>Select Position</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{programName}</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>

    {isLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primaryDark} />
        <Text style={styles.loadingText}>Loading positions…</Text>
      </View>
    ) : (
      <FlatList
        data={tasks}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => onSelect(item)}
            style={styles.listItem}
            activeOpacity={0.7}>
            <Text style={styles.listItemText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No positions available</Text>
          </View>
        }
      />
    )}
  </BottomSheet>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {padding: theme.spacing.xs},
  closeText: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: theme.fonts.regular,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.xs + 2,
  },
  listContent: {padding: theme.spacing.md},
  listItem: {
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: '#F7F9FC',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listItemText: {
    fontSize: theme.fontSize.base,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  emptyContainer: {padding: 32, alignItems: 'center'},
  emptyText: {
    fontFamily: theme.fonts.regular,
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs + 2,
  },
});

export default PositionModal;

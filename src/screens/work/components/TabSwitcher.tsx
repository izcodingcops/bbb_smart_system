import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {UserRole} from '../../../types/auth';
import {WorkBucket} from '../../../types/work';
import {theme} from '../../../theme';

interface Props {
  bucket: WorkBucket;
  role: UserRole;
  assignedCount: number;
  unassignedCount: number;
  completedCount: number;
  onChange: (bucket: WorkBucket) => void;
}

const TabSwitcher: React.FC<Props> = ({
  bucket,
  role,
  assignedCount,
  unassignedCount,
  completedCount,
  onChange,
}) => {
  const renderTab = (value: WorkBucket, label: string, count: number) => {
    const active = bucket === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.tab, active && styles.tabActive]}
        activeOpacity={0.85}
        onPress={() => onChange(value)}>
        <Text style={[styles.tabText, active && styles.tabTextActive]}>
          {label}
        </Text>
        <View style={[styles.count, active && styles.countActive]}>
          <Text style={[styles.countText, active && styles.countTextActive]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.row}>
      {renderTab('assigned', 'Assigned', assignedCount)}
      {role === 'supervisor'
        ? renderTab('unassigned', 'Unassigned', unassignedCount)
        : null}
      {renderTab('completed', 'Completed', completedCount)}
    </View>
  );
};

const styles = StyleSheet.create({
  // Track is the chip fill rather than a solid gray, so the page gradient
  // reads through it the way the filter chips beneath it do.
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.glass.chipFill,
    borderWidth: 1,
    borderColor: theme.glass.pillBorder,
    borderRadius: 14,
    padding: 4,
    ...theme.shadow.glassPill,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: theme.glass.buttonFill,
    ...theme.shadow.glassPill,
  },
  tabText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {color: theme.colors.primary, fontFamily: theme.fonts.black},
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countActive: {backgroundColor: theme.colors.accentTint},
  countText: {
    fontFamily: theme.fonts.black,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  countTextActive: {color: theme.colors.primary},
});

export default TabSwitcher;

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {theme} from '../../../theme';

export interface DispatchTab {
  value: string;
  label: string;
}

interface Props {
  tabs: DispatchTab[];
  value: string;
  onChange: (value: string) => void;
}

/** Chip-style tab strip above the detail panels. */
const DispatchTabs: React.FC<Props> = ({tabs, value, onChange}) => (
  <View style={styles.row}>
    {tabs.map(tab => {
      const active = tab.value === value;
      return (
        <TouchableOpacity
          key={tab.value}
          style={[styles.tab, active && styles.tabActive]}
          activeOpacity={0.85}
          onPress={() => onChange(tab.value)}>
          <Text style={[styles.label, active && styles.labelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 14,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  tabActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  labelActive: {fontFamily: theme.fonts.black, color: theme.colors.white},
});

export default React.memo(DispatchTabs);

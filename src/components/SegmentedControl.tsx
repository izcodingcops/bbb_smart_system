import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {theme} from '../theme';

export interface SegmentedOption {
  label: string;
  value: string;
}

interface Props {
  options: SegmentedOption[];
  value: string | null;
  onChange: (value: string) => void;
  testID?: string;
}

const SegmentedControl: React.FC<Props> = ({options, value, onChange, testID = 'segmented'}) => (
  <View style={styles.row}>
    {options.map(option => {
      const selected = option.value === value;
      return (
        <TouchableOpacity
          key={option.value}
          testID={`${testID}-${option.value}`}
          style={[styles.segment, selected && styles.segmentSelected]}
          activeOpacity={0.7}
          onPress={() => onChange(option.value)}>
          <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: theme.spacing.sm},
  segment: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  segmentSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  label: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.xs + 2,
    color: theme.colors.textSecondary,
  },
  labelSelected: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
  },
});

export default SegmentedControl;

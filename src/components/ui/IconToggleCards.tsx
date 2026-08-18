import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {theme} from '../../theme';

export interface IconToggleOption<T extends string> {
  value: T;
  label: string;
  Icon: React.FC<{size?: number; color?: string}>;
}

interface Props<T extends string> {
  options: IconToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Side-by-side icon cards; the chosen one turns dashed-blue. The design's
 * `.asgc` "assignee toggle cards" — lifted out of Maintenance's own
 * `AssigneeToggle`, which existed as a lookalike of this exact control before
 * Observation Reports needed the same Ambassador/Supervisor pattern for a
 * different domain.
 */
function IconToggleCards<T extends string>({options, value, onChange}: Props<T>) {
  // Three across needs tighter padding and smaller type to fit — the design
  // treats it as its own variant rather than just squeezing the two-up cards.
  const dense = options.length > 2;

  return (
    <View style={[styles.row, dense && styles.rowDense]}>
      {options.map(option => {
        const selected = option.value === value;
        const color = selected ? theme.colors.primary : theme.colors.textSecondary;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.card, dense && styles.cardDense, selected && styles.cardSelected]}
            activeOpacity={0.85}
            onPress={() => onChange(option.value)}>
            <option.Icon size={dense ? 20 : 24} color={color} />
            <Text
              style={[
                styles.label,
                dense && styles.labelDense,
                selected && styles.labelSelected,
              ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: theme.spacing.md},
  rowDense: {gap: theme.spacing.sm},
  card: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: '#F4F5F7',
  },
  cardDense: {paddingTop: 12, paddingBottom: 10, paddingHorizontal: 4},
  cardSelected: {
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  labelDense: {fontSize: 12.5},
  labelSelected: {
    fontFamily: theme.fonts.black,
    color: theme.colors.primary,
  },
});

export default IconToggleCards;

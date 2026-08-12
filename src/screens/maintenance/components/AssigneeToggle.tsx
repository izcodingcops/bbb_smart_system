import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  UserIcon,
  UserPlusIcon,
  UsersIcon,
} from '../../../components/icons';
import {MaintenanceAssigneeKind} from '../../../types/maintenance';
import {theme} from '../../../theme';

export interface AssigneeOption {
  kind: MaintenanceAssigneeKind;
  label: string;
}

interface Props {
  /** Role-gated by the caller; this component just renders what it is given. */
  options: AssigneeOption[];
  value: MaintenanceAssigneeKind;
  onChange: (kind: MaintenanceAssigneeKind) => void;
}

const ICON: Record<MaintenanceAssigneeKind, React.FC<{size?: number; color?: string}>> = {
  Supervisor: UserIcon,
  Department: UsersIcon,
  Ambassador: UserPlusIcon,
  Me: UserIcon,
};

/** Side-by-side cards; the chosen one turns dashed-blue. */
const AssigneeToggle: React.FC<Props> = ({options, value, onChange}) => {
  // Three across needs tighter padding and smaller type to fit — the design
  // treats it as its own variant rather than just squeezing the two-up cards.
  const dense = options.length > 2;

  return (
    <View style={[styles.row, dense && styles.rowDense]}>
      {options.map(option => {
        const selected = option.kind === value;
        const color = selected
          ? theme.colors.primary
          : theme.colors.textSecondary;
        const Icon = ICON[option.kind];
        return (
          <TouchableOpacity
            key={option.kind}
            style={[
              styles.card,
              dense && styles.cardDense,
              selected && styles.cardSelected,
            ]}
            activeOpacity={0.85}
            onPress={() => onChange(option.kind)}>
            <Icon size={dense ? 20 : 24} color={color} />
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
};

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

export default AssigneeToggle;

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {UserIcon, UsersIcon} from '../../../components/icons';
import {MaintenanceAssigneeKind} from '../../../types/maintenance';
import {theme} from '../../../theme';

interface Props {
  value: MaintenanceAssigneeKind;
  onChange: (kind: MaintenanceAssigneeKind) => void;
}

const OPTIONS: {kind: MaintenanceAssigneeKind; label: string}[] = [
  {kind: 'Supervisor', label: 'Supervisor'},
  {kind: 'Department', label: 'Department'},
];

/** Two side-by-side cards; the chosen one turns dashed-blue. */
const AssigneeToggle: React.FC<Props> = ({value, onChange}) => (
  <View style={styles.row}>
    {OPTIONS.map(option => {
      const selected = option.kind === value;
      const color = selected ? theme.colors.primary : theme.colors.textSecondary;
      return (
        <TouchableOpacity
          key={option.kind}
          style={[styles.card, selected && styles.cardSelected]}
          activeOpacity={0.85}
          onPress={() => onChange(option.kind)}>
          {option.kind === 'Supervisor' ? (
            <UserIcon size={24} color={color} />
          ) : (
            <UsersIcon size={24} color={color} />
          )}
          <Text style={[styles.label, selected && styles.labelSelected]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: theme.spacing.md},
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
  labelSelected: {
    fontFamily: theme.fonts.black,
    color: theme.colors.primary,
  },
});

export default AssigneeToggle;

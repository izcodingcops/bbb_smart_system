import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {theme} from '../theme';
import {MaintenanceAssigneeType} from '../types/maintenance';

interface Props {
  value: MaintenanceAssigneeType | null;
  onChange: (value: MaintenanceAssigneeType) => void;
  testID?: string;
}

const PersonIcon: React.FC<{active: boolean}> = ({active}) => (
  <View style={iconStyles.wrap}>
    <View style={[iconStyles.personHead, active && iconStyles.iconActive]} />
    <View style={[iconStyles.personBody, active && iconStyles.iconActive]} />
  </View>
);

const BuildingIcon: React.FC<{active: boolean}> = ({active}) => (
  <View style={iconStyles.wrap}>
    <View style={[iconStyles.building, active && iconStyles.iconActive]}>
      <View style={iconStyles.buildingRow}>
        <View style={[iconStyles.buildingWindow, active && iconStyles.iconActive]} />
        <View style={[iconStyles.buildingWindow, active && iconStyles.iconActive]} />
      </View>
      <View style={iconStyles.buildingRow}>
        <View style={[iconStyles.buildingWindow, active && iconStyles.iconActive]} />
        <View style={[iconStyles.buildingWindow, active && iconStyles.iconActive]} />
      </View>
    </View>
  </View>
);

const OPTIONS: Array<{value: MaintenanceAssigneeType; label: string}> = [
  {value: 'Ambassador', label: 'Ambassador'},
  {value: 'Department', label: 'Department'},
];

const AssigneeTypeSelector: React.FC<Props> = ({value, onChange, testID = 'assignee-type-selector'}) => (
  <View style={styles.row}>
    {OPTIONS.map(option => {
      const active = option.value === value;
      return (
        <TouchableOpacity
          key={option.value}
          testID={`${testID}-${option.value}`}
          style={[styles.card, active && styles.cardActive]}
          activeOpacity={0.7}
          onPress={() => onChange(option.value)}>
          {option.value === 'Ambassador' ? (
            <PersonIcon active={active} />
          ) : (
            <BuildingIcon active={active} />
          )}
          <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
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
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.background,
  },
  cardActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  label: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.xs + 2,
    color: theme.colors.textSecondary,
  },
  labelActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
  },
});

const iconStyles = StyleSheet.create({
  wrap: {width: 24, height: 24, alignItems: 'center', justifyContent: 'center'},
  personHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.textMuted,
  },
  personBody: {
    marginTop: 2,
    width: 18,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    backgroundColor: theme.colors.textMuted,
  },
  building: {width: 16, height: 18, justifyContent: 'space-between'},
  buildingRow: {flexDirection: 'row', justifyContent: 'space-between'},
  buildingWindow: {width: 6, height: 6, borderRadius: 1, backgroundColor: theme.colors.textMuted},
  iconActive: {backgroundColor: theme.colors.primary},
});

export default AssigneeTypeSelector;

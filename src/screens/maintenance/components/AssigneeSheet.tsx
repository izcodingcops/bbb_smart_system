import React, {useEffect, useState} from 'react';
import {Alert, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  BottomSheet,
  DropdownField,
  PriorityPill,
  PrimaryButton,
} from '../../../components/ui';
import {UserIcon, UserPlusIcon, UsersIcon} from '../../../components/icons';
import {useAuth} from '../../../hooks/useAuth';
import {
  useAssignMaintenanceRequestMutation,
  useMaintenanceFormOptionsQuery,
} from '../../../graphql/features/maintenance/hooks';
import {MaintenanceAssigneeKind} from '../../../types/maintenance';
import {WorkItem, WorkPriority} from '../../../types/work';
import {theme} from '../../../theme';

type Mode = 'Ambassador' | 'Department' | 'Me';

const MODE_OPTIONS: {value: Mode; label: string}[] = [
  {value: 'Ambassador', label: 'Ambassador'},
  {value: 'Department', label: 'Department'},
  {value: 'Me', label: 'Me'},
];

const PRIORITY_STYLE: Record<WorkPriority, {bg: string; fg: string}> = {
  High: {bg: '#FFF2F0', fg: '#CF1322'},
  Medium: {bg: '#FFFBE6', fg: '#AD8B00'},
  Low: {bg: '#F6FFED', fg: '#389E0D'},
};

interface Props {
  /** Null when closed — also doubles as "which record this sheet targets". */
  target: WorkItem | null;
  onClose: () => void;
  /** Fired after a successful assign, so the caller can toast. */
  onAssigned: (item: WorkItem, label: string) => void;
}

/**
 * Supervisor-only "claim" workflow for an Unassigned maintenance card —
 * mirrors the mockup's read-only summary + Ambassador/Department/Me picker.
 * Ambassadors never see this: it's only ever opened from an 'unassigned'-
 * bucket card, and Ambassadors never render that bucket (their tab set has
 * no Unassigned tab).
 */
const AssigneeSheet: React.FC<Props> = ({target, onClose, onAssigned}) => {
  const {user} = useAuth();
  const {data: options} = useMaintenanceFormOptionsQuery();
  const {mutate: assign, isLoading} = useAssignMaintenanceRequestMutation();
  const [mode, setMode] = useState<Mode>('Ambassador');
  const [value, setValue] = useState<string | null>(null);

  // Fresh every open, and "Me" pre-fills immediately since it needs no picker.
  useEffect(() => {
    if (target) {
      setMode('Ambassador');
      setValue(null);
    }
  }, [target]);

  if (!target) {
    return null;
  }

  const canAssign =
    !isLoading && (mode === 'Me' || (value !== null && value.length > 0));

  const submit = async () => {
    if (!canAssign) {
      return;
    }
    const kind: MaintenanceAssigneeKind =
      mode === 'Department' ? 'Department' : 'Supervisor';
    const name = mode === 'Me' ? user?.name ?? 'You' : value ?? '';
    try {
      await assign(target.id, kind, name);
      onAssigned(target, name);
      onClose();
    } catch {
      Alert.alert(
        "Couldn't assign",
        `${target.reference} is unchanged. Check your connection and try again.`,
      );
    }
  };

  const priority = PRIORITY_STYLE[target.priority];
  const modeIcon = (forMode: Mode, color: string) => {
    switch (forMode) {
      case 'Ambassador':
        return <UserPlusIcon size={21} color={color} />;
      case 'Department':
        return <UsersIcon size={21} color={color} />;
      case 'Me':
        return <UserIcon size={21} color={color} />;
    }
  };

  return (
    <BottomSheet
      visible={!!target}
      title="Choose Assignee"
      onClose={onClose}
      footer={
        <PrimaryButton
          label="Assign Maintenance"
          onPress={submit}
          disabled={!canAssign}
          style={styles.footerButton}
        />
      }>
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Report ID</Text>
          <Text style={styles.summaryValue}>{target.reference}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Type</Text>
          <Text style={styles.summaryValue}>{target.type}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Priority</Text>
          <PriorityPill label={target.priority} bg={priority.bg} fg={priority.fg} />
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Zone</Text>
          <Text style={styles.summaryValue}>{target.zone}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Address</Text>
          <Text style={styles.summaryValue}>{target.address}</Text>
        </View>
        {target.createdBy ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Sent By</Text>
            <Text style={styles.summaryValue}>{target.createdBy}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.pickLabel}>
        Choose Assignee <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.modeRow}>
        {MODE_OPTIONS.map(option => {
          const selected = option.value === mode;
          const color = selected ? theme.colors.primary : theme.colors.textSecondary;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.modeCard, selected && styles.modeCardSelected]}
              activeOpacity={0.85}
              onPress={() => {
                setMode(option.value);
                setValue(null);
              }}>
              {modeIcon(option.value, color)}
              <Text style={[styles.modeLabel, selected && styles.modeLabelSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {mode === 'Ambassador' ? (
        <DropdownField
          label="Ambassador"
          required
          placeholder="Search & select ambassador"
          options={options?.ambassadors ?? []}
          value={value}
          onChange={setValue}
          searchable
        />
      ) : null}

      {mode === 'Department' ? (
        <DropdownField
          label="Department"
          required
          placeholder="Search & select department"
          options={options?.departments ?? []}
          value={value}
          onChange={setValue}
          searchable
        />
      ) : null}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  summary: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F4F5F7',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  summaryKey: {
    width: 84,
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: theme.colors.text,
  },
  pickLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  required: {color: '#CF1322'},
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  modeCard: {
    flex: 1,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  modeCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  modeLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textSecondary,
  },
  modeLabelSelected: {
    fontFamily: theme.fonts.black,
    color: theme.colors.primary,
  },
  footerButton: {flex: 1},
});

export default AssigneeSheet;

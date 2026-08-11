import React, {useEffect, useState} from 'react';
import {Alert, View, StyleSheet} from 'react-native';
import {BottomSheet, DropdownField, PrimaryButton, SegmentedButtons} from '../../../components/ui';
import {useAuth} from '../../../hooks/useAuth';
import {
  useAssignMaintenanceRequestMutation,
  useMaintenanceFormOptionsQuery,
} from '../../../graphql/features/maintenance/hooks';
import {MaintenanceAssigneeKind} from '../../../types/maintenance';
import {WorkItem} from '../../../types/work';
import {theme} from '../../../theme';

type Mode = 'Ambassador' | 'Department' | 'Me';

const MODE_OPTIONS: {value: Mode; label: string}[] = [
  {value: 'Ambassador', label: 'Ambassador'},
  {value: 'Department', label: 'Department'},
  {value: 'Me', label: 'Me'},
];

interface Props {
  /** Null when closed — also doubles as "which record this sheet targets". */
  target: WorkItem | null;
  onClose: () => void;
  /** Fired after a successful assign, so the caller can toast. */
  onAssigned: (item: WorkItem, label: string) => void;
}

/**
 * Supervisor-only "claim" workflow for an Unassigned maintenance card —
 * mirrors the mockup's Ambassador/Department/Me picker. Ambassadors never
 * see this: it's only ever opened from an 'unassigned'-bucket card, and
 * Ambassadors never render that bucket (their tab set has no Unassigned tab).
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

  return (
    <BottomSheet visible={!!target} title="Choose Assignee" onClose={onClose}>
      <View style={styles.field}>
        <SegmentedButtons
          options={MODE_OPTIONS}
          value={mode}
          onChange={next => {
            setMode(next as Mode);
            setValue(null);
          }}
        />
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

      <View style={styles.footer}>
        <PrimaryButton
          label="Assign Maintenance"
          onPress={submit}
          disabled={!canAssign}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  field: {marginBottom: theme.spacing.md},
  footer: {marginTop: theme.spacing.lg},
});

export default AssigneeSheet;

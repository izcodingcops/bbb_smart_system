import React, {useEffect, useState} from 'react';
import {Alert, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  BottomSheet,
  DateTimeField,
  DropdownField,
  FieldLabel,
  SegmentedButtons,
  TextField,
} from '../../../components/ui';
import {
  useCreateIncidentMutation,
  useIncidentFormOptionsQuery,
} from '../../../graphql/features/incident/hooks';
import {IncidentPriority} from '../../../types/incident';
import {buildInitialValues} from '../../incident/components/IncidentForm';
import {theme} from '../../../theme';

const PRIORITY_OPTIONS = [
  {value: 'Low', label: 'Low'},
  {value: 'Medium', label: 'Medium'},
  {value: 'High', label: 'High'},
];

interface Props {
  visible: boolean;
  /** Seeds the new incident's address from the maintenance form's own. */
  defaultAddress: string;
  /** Fires once the incident exists, so the form can refetch its options. */
  onCreated: () => void;
  onClose: () => void;
}

/**
 * Creates a real incident without leaving the maintenance form — the full
 * Create Incident screen's required fields only, with everything else left at
 * the blank form's defaults for the user to fill in from the Incident module
 * later. Per the no-nesting rule, this never offers Connected Elements of its
 * own.
 */
const AddIncidentSheet: React.FC<Props> = ({
  visible,
  defaultAddress,
  onCreated,
  onClose,
}) => {
  const {data: options} = useIncidentFormOptionsQuery({skip: !visible});
  const {mutate: createIncident, isLoading} = useCreateIncidentMutation();

  const [incidentType, setIncidentType] = useState<string | null>(null);
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString());
  const [outcome, setOutcome] = useState<string | null>(null);
  const [priority, setPriority] = useState<IncidentPriority>('Low');
  const [address, setAddress] = useState(defaultAddress);
  const [description, setDescription] = useState('');

  // Fresh every open — a half-filled incident shouldn't survive a dismissal.
  useEffect(() => {
    if (visible) {
      setIncidentType(null);
      setOccurredAt(new Date().toISOString());
      setOutcome(null);
      setPriority('Low');
      setAddress(defaultAddress);
      setDescription('');
    }
  }, [visible, defaultAddress]);

  const canSave =
    !!options &&
    !!incidentType &&
    !!outcome &&
    address.trim().length > 0 &&
    !isLoading;

  const save = async () => {
    if (!canSave || !options || !incidentType || !outcome) {
      return;
    }
    try {
      await createIncident({
        ...buildInitialValues(options),
        incidentType,
        occurredAt,
        outcome,
        priority,
        address: address.trim(),
        description,
      });
      onCreated();
      onClose();
    } catch {
      Alert.alert(
        "Couldn't add incident",
        'Something went wrong. Check your connection and try again.',
      );
    }
  };

  return (
    <BottomSheet visible={visible} title="Add Incident" onClose={onClose}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basic Details</Text>
        <DropdownField
          label="Incident Type"
          required
          placeholder="Select incident type"
          options={options?.incidentTypes ?? []}
          value={incidentType}
          onChange={setIncidentType}
        />
        <DateTimeField
          label="Incident Date & Time"
          required
          value={occurredAt}
          onChange={setOccurredAt}
        />
        <DropdownField
          label="Outcome"
          required
          placeholder="Select outcome"
          options={options?.outcomes ?? []}
          value={outcome}
          onChange={setOutcome}
        />
        <View style={styles.lastField}>
          <FieldLabel label="Priority" required />
          <SegmentedButtons
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={next => setPriority(next as IncidentPriority)}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location Details</Text>
        <View style={styles.lastField}>
          <FieldLabel label="Address" required />
          <TextField
            placeholder="Where did it happen?"
            value={address}
            onChangeText={setAddress}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Other Details</Text>
        <View style={styles.lastField}>
          <FieldLabel label="Description" />
          <TextField
            placeholder="Add any notes about this incident…"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.textarea}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.save, !canSave && styles.saveDisabled]}
        activeOpacity={0.9}
        disabled={!canSave}
        onPress={save}>
        <Text style={styles.saveText}>Save &amp; Select</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  cardTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 18,
    letterSpacing: -0.2,
    color: theme.colors.text,
    marginBottom: 14,
  },
  lastField: {marginBottom: 6},
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.md,
  },
  save: {
    height: 50,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.lg,
  },
  saveDisabled: {opacity: 0.45},
  saveText: {
    fontFamily: theme.fonts.black,
    fontSize: 15.5,
    color: theme.colors.white,
  },
});

export default AddIncidentSheet;

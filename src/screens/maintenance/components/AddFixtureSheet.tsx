import React, {useEffect, useState} from 'react';
import {Alert, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  AccordionSection,
  BottomSheet,
  DateTimeField,
  DropdownField,
  FieldLabel,
  SegmentedButtons,
  TextField,
  UploadField,
} from '../../../components/ui';
import {useCreateMaintenanceFixtureMutation} from '../../../graphql/features/maintenance/hooks';
import {MaintenanceFormOptions} from '../../../types/maintenance';
import {theme} from '../../../theme';

const STATUS_OPTIONS = [
  {value: 'Active', label: 'Active'},
  {value: 'Inactive', label: 'Inactive'},
];

interface Props {
  visible: boolean;
  options: MaintenanceFormOptions;
  /** Called with the new fixture's name once it's been created. */
  onCreated: (fixtureName: string) => void;
  onClose: () => void;
}

/**
 * Creates a fixture without leaving the maintenance form. The sheet shows the
 * Fixture module's whole Basic/Location/Other set, but only Title and Fixture
 * Type are required — the rest is context the ambassador may already know.
 */
const AddFixtureSheet: React.FC<Props> = ({
  visible,
  options,
  onCreated,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [fixtureType, setFixtureType] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState(new Date().toISOString());
  const [status, setStatus] = useState('Active');
  const [describeLocation, setDescribeLocation] = useState('');
  const [zone, setZone] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [documents, setDocuments] = useState<string[]>([]);
  const {mutate: createFixture, isLoading} =
    useCreateMaintenanceFixtureMutation();

  // Fresh every open — a half-filled fixture shouldn't survive a dismissal.
  useEffect(() => {
    if (visible) {
      setTitle('');
      setFixtureType(null);
      setCreatedAt(new Date().toISOString());
      setStatus('Active');
      setDescribeLocation('');
      setZone(null);
      setDescription('');
      setDocuments([]);
    }
  }, [visible]);

  const canSave = title.trim().length > 0 && !!fixtureType && !isLoading;

  const save = async () => {
    if (!canSave || !fixtureType) {
      return;
    }
    try {
      const name = await createFixture(title.trim(), fixtureType);
      onCreated(name);
      onClose();
    } catch {
      Alert.alert(
        "Couldn't add fixture",
        'Something went wrong. Check your connection and try again.',
      );
    }
  };

  return (
    <BottomSheet visible={visible} title="Add Fixture" onClose={onClose}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basic Details</Text>
        <View style={styles.field}>
          <FieldLabel label="Title" required />
          <TextField
            placeholder="e.g. 16th St Floor Fixture"
            value={title}
            onChangeText={setTitle}
          />
        </View>
        <DateTimeField
          label="Request Date & Time"
          required
          value={createdAt}
          onChange={setCreatedAt}
        />
        <DropdownField
          label="Fixture Type"
          required
          placeholder="Select fixture type"
          options={options.fixtureTypes}
          value={fixtureType}
          onChange={setFixtureType}
          searchable={false}
        />
        <View style={styles.lastField}>
          <FieldLabel label="Status" required />
          <SegmentedButtons
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location Details</Text>
        <View style={styles.field}>
          <FieldLabel label="Describe Location" />
          <TextField
            placeholder="e.g. North entrance, near bus stop"
            value={describeLocation}
            onChangeText={setDescribeLocation}
          />
        </View>
        <View style={styles.lastField}>
          <DropdownField
            label="Zone"
            placeholder="Select zone"
            options={options.zones}
            value={zone}
            onChange={setZone}
            searchable={false}
          />
        </View>
      </View>

      <AccordionSection title="Other Details" initiallyOpen>
        <View style={styles.field}>
          <FieldLabel label="Description" />
          <TextField
            placeholder="Add any notes about this fixture…"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.textarea}
          />
        </View>
        <UploadField
          label="Document"
          uris={documents}
          onChange={setDocuments}
        />
      </AccordionSection>

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
  field: {marginBottom: theme.spacing.lg},
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

export default AddFixtureSheet;

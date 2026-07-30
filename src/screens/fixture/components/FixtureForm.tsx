import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  AccordionSection,
  ConfirmDialog,
  DateTimeField,
  DropdownField,
  FieldLabel,
  SegmentedButtons,
  TextField,
} from '../../../components/ui';
import {ChevronLeftIcon, MapPinIcon, RefreshIcon, XIcon} from '../../../components/icons';
import {
  FixtureDetail,
  FixtureFormOptions,
  FixtureFormValues,
  FixtureStatus,
} from '../../../types/fixture';
import UploadField from '../../maintenance/components/UploadField';
import {theme} from '../../../theme';

/** Fallback address when a record has none — matches the design's auto-fill. */
const DEFAULT_ADDRESS = 'Rue Des Hauteurs, Val-David, Quebec J0T 2N0, Canada';

const STATUS_OPTIONS = [
  {value: 'Active', label: 'Active'},
  {value: 'Inactive', label: 'Inactive'},
];

/** Create starts from device state; edit starts from the saved record. */
export function buildInitialValues(
  options: FixtureFormOptions,
  detail?: FixtureDetail,
): FixtureFormValues {
  if (detail) {
    return {
      title: detail.title,
      serviceDateTime: detail.createdAt,
      fixtureType: detail.fixtureType,
      status: detail.status,
      address: detail.address,
      describeLocation: detail.describeLocation ?? '',
      zone: detail.zone,
      description: detail.description ?? '',
      documents: detail.documents,
    };
  }
  return {
    title: '',
    serviceDateTime: new Date().toISOString(),
    fixtureType: '',
    status: 'Active',
    address: DEFAULT_ADDRESS,
    describeLocation: '',
    zone: options.zones[0] ?? '',
    description: '',
    documents: [],
  };
}

interface Props {
  mode: 'create' | 'edit';
  /** Display reference shown under the title, e.g. '#FX-42986'. */
  reference: string;
  options: FixtureFormOptions;
  initialValues: FixtureFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: FixtureFormValues) => void;
  onClose: () => void;
}

const FixtureForm: React.FC<Props> = ({
  mode,
  reference,
  options,
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [values, setValues] = useState<FixtureFormValues>(initialValues);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const set = <K extends keyof FixtureFormValues>(
    key: K,
    value: FixtureFormValues[K],
  ) => setValues(current => ({...current, [key]: value}));

  // Title + Fixture Type gate submit; Status/Zone/Service Date/Address are
  // pre-seeded, and !isSubmitting guards against double-submit.
  const canSubmit =
    values.title.trim().length > 0 && values.fixtureType.length > 0 && !isSubmitting;

  const title = mode === 'create' ? 'Create Fixture' : 'Edit Fixture';

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.topbar}>
        <View style={styles.topbarRow}>
          <TouchableOpacity
            style={styles.topbarButton}
            activeOpacity={0.8}
            onPress={() =>
              mode === 'create' ? setConfirmDiscard(true) : onClose()
            }>
            {mode === 'create' ? (
              <XIcon size={19} color="#3A3F46" />
            ) : (
              <ChevronLeftIcon size={19} color="#3A3F46" />
            )}
          </TouchableOpacity>
          <View style={styles.topbarText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.reference}>{reference}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled">
        {/* ---- Basic Details ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Details</Text>

          <View style={styles.field}>
            <FieldLabel label="Title" required />
            <TextField
              placeholder="e.g. 16th St Floor Fixture"
              value={values.title}
              onChangeText={next => set('title', next)}
            />
          </View>

          <DateTimeField
            label="Service Date & Time"
            required
            value={values.serviceDateTime}
            onChange={next => set('serviceDateTime', next)}
          />

          <DropdownField
            label="Fixture Type"
            required
            placeholder="Select fixture type"
            options={options.fixtureTypes}
            value={values.fixtureType}
            onChange={next => set('fixtureType', next)}
          />

          <View style={styles.lastField}>
            <FieldLabel label="Status" required />
            <SegmentedButtons
              options={STATUS_OPTIONS}
              value={values.status}
              onChange={next => set('status', next as FixtureStatus)}
            />
          </View>
        </View>

        {/* ---- Location Details ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Details</Text>

          <View style={styles.field}>
            <FieldLabel
              label="Address"
              required
              trailing={
                <TouchableOpacity
                  style={styles.changeLocation}
                  activeOpacity={0.7}
                  onPress={() =>
                    Alert.alert(
                      'Coming soon',
                      'Picking a location on the map is not wired up yet.',
                    )
                  }>
                  <RefreshIcon size={14} color={theme.colors.primary} />
                  <Text style={styles.changeLocationText}>Change Location</Text>
                </TouchableOpacity>
              }
            />
            <View style={styles.addressBox}>
              <MapPinIcon size={19} color={theme.colors.primary} />
              <Text style={styles.addressText}>{values.address}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <FieldLabel label="Describe Location" />
            <TextField
              placeholder="e.g. USA — north plaza"
              value={values.describeLocation}
              onChangeText={next => set('describeLocation', next)}
            />
          </View>

          <View style={styles.lastField}>
            <DropdownField
              label="Zone"
              required
              placeholder="Select zone"
              options={options.zones}
              value={values.zone}
              onChange={next => set('zone', next)}
              searchable={false}
            />
          </View>
        </View>

        {/* ---- Other Details ---- */}
        <AccordionSection title="Other Details">
          <View style={styles.field}>
            <FieldLabel label="Description" />
            <TextField
              placeholder="Add any notes about this fixture…"
              value={values.description}
              onChangeText={next => set('description', next)}
              multiline
              numberOfLines={4}
              style={styles.textarea}
            />
          </View>
          <UploadField
            label="Document"
            uris={values.documents}
            onChange={next => set('documents', next)}
          />
        </AccordionSection>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity
          style={[styles.submit, !canSubmit && styles.submitDisabled]}
          activeOpacity={0.9}
          disabled={!canSubmit}
          onPress={() =>
            mode === 'create' ? setConfirmSubmit(true) : onSubmit(values)
          }>
          <Text style={styles.submitText}>{submitLabel}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmSubmit}
        title="Submit fixture?"
        message={`Fixture ${reference} will be created and added to your Work Log. You can edit it later from the details screen.`}
        confirmLabel="Submit"
        icon="check"
        iconTone="primary"
        confirmTone="primary"
        onConfirm={() => {
          setConfirmSubmit(false);
          onSubmit(values);
        }}
        onCancel={() => setConfirmSubmit(false)}
      />

      <ConfirmDialog
        visible={confirmDiscard}
        title="Discard this fixture?"
        message="You have unsaved details. If you leave now, everything you entered on this form will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  topbar: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  topbarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: theme.spacing.xs,
  },
  topbarButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F1F4',
  },
  topbarText: {flex: 1, minWidth: 0},
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    letterSpacing: -0.6,
    color: theme.colors.text,
  },
  reference: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  body: {flex: 1},
  bodyContent: {paddingBottom: 40},
  section: {
    marginHorizontal: theme.spacing.lg,
    marginTop: 14,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    ...theme.shadow.card,
  },
  sectionTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 18,
    letterSpacing: -0.2,
    color: theme.colors.text,
    marginBottom: 14,
  },
  field: {marginBottom: theme.spacing.lg},
  lastField: {marginBottom: 6},
  textarea: {minHeight: 96, textAlignVertical: 'top', paddingTop: theme.spacing.md},
  changeLocation: {flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto'},
  changeLocationText: {fontFamily: theme.fonts.black, fontSize: 13, color: theme.colors.primary},
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: 14,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: '#F4F5F7',
  },
  addressText: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 14.5,
    lineHeight: 20,
    color: theme.colors.text,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    backgroundColor: theme.colors.white,
  },
  submit: {
    height: 54,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginBottom: 13,
  },
  submitDisabled: {opacity: 0.45},
  submitText: {
    fontFamily: theme.fonts.black,
    fontSize: 16,
    letterSpacing: 0.2,
    color: theme.colors.white,
  },
});

export default FixtureForm;

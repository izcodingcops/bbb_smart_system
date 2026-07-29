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
  MultiDropdownField,
  SegmentedButtons,
  TextField,
} from '../../../components/ui';
import {
  ChevronLeftIcon,
  MapPinIcon,
  RefreshIcon,
  XIcon,
} from '../../../components/icons';
import {
  MaintenanceDetail,
  MaintenanceFormOptions,
  MaintenanceFormValues,
  MaintenancePriority,
} from '../../../types/maintenance';
import AssigneeToggle from './AssigneeToggle';
import UploadField from './UploadField';
import {theme} from '../../../theme';

/** Fallback address when a record has none — matches the design's auto-fill. */
const DEFAULT_ADDRESS = 'Rue Des Hauteurs, Val-David, Quebec J0T 2N0, Canada';

const PRIORITY_OPTIONS = [
  {value: 'Low', label: 'Low'},
  {value: 'Medium', label: 'Medium'},
  {value: 'High', label: 'High'},
];

/** Create starts from device state; edit starts from the saved record. */
export function buildInitialValues(
  options: MaintenanceFormOptions,
  detail?: MaintenanceDetail,
): MaintenanceFormValues {
  if (detail) {
    return {
      type: detail.type,
      requestedAt: detail.requestedAt,
      assigneeKind: detail.assigneeKind,
      department: detail.department,
      priority: detail.priority,
      address: detail.address,
      zone: detail.zone,
      describeLocation: detail.describeLocation ?? '',
      businessName: detail.businessName || null,
      description: detail.description ?? '',
      documents: detail.documents,
      fixture: detail.fixture,
      incidents: detail.incidents,
      pois: detail.pois,
      equipment: detail.equipment,
    };
  }
  return {
    type: '',
    requestedAt: new Date().toISOString(),
    assigneeKind: 'Supervisor',
    department: null,
    priority: 'Low',
    address: DEFAULT_ADDRESS,
    zone: options.zones[0] ?? null,
    describeLocation: '',
    businessName: null,
    description: '',
    documents: [],
    fixture: null,
    incidents: [],
    pois: [],
    equipment: [],
  };
}

interface Props {
  mode: 'create' | 'edit';
  /** Display reference shown under the title, e.g. '#MT-40891'. */
  reference: string;
  options: MaintenanceFormOptions;
  initialValues: MaintenanceFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: MaintenanceFormValues) => void;
  onClose: () => void;
  /** Fires once the Fixture sheet has closed, so a quick-create can open. */
  onAddFixture?: () => void;
}

const MaintenanceForm: React.FC<Props> = ({
  mode,
  reference,
  options,
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onClose,
  onAddFixture,
}) => {
  const [values, setValues] = useState<MaintenanceFormValues>(initialValues);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const set = <K extends keyof MaintenanceFormValues>(
    key: K,
    value: MaintenanceFormValues[K],
  ) => setValues(current => ({...current, [key]: value}));

  // Everything else is pre-seeded, so type is the only gate on submitting.
  const canSubmit = values.type.length > 0 && !isSubmitting;

  const title = mode === 'create' ? 'Create Maintenance' : 'Edit Maintenance';

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

          <DropdownField
            label="Maintenance Type"
            required
            placeholder="Select maintenance type"
            options={options.types}
            value={values.type || null}
            onChange={next => set('type', next)}
          />

          <DateTimeField
            label="Request Date & Time"
            required
            value={values.requestedAt}
            onChange={next => set('requestedAt', next)}
          />

          <View style={styles.field}>
            <FieldLabel label="Choose Assignee" required />
            <AssigneeToggle
              value={values.assigneeKind}
              onChange={kind => {
                setValues(current => ({
                  ...current,
                  assigneeKind: kind,
                  department: kind === 'Supervisor' ? null : current.department,
                }));
              }}
            />
            {values.assigneeKind === 'Department' ? (
              <View style={styles.nested}>
                <DropdownField
                  label="Department"
                  placeholder="Select department"
                  options={options.departments}
                  value={values.department}
                  onChange={next => set('department', next)}
                  searchable={false}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.lastField}>
            <FieldLabel label="Priority" required />
            <SegmentedButtons
              options={PRIORITY_OPTIONS}
              value={values.priority}
              onChange={next => set('priority', next as MaintenancePriority)}
            />
          </View>
        </View>

        {/* ---- Other Details ---- */}
        <AccordionSection title="Other Details">
          <View style={styles.field}>
            <FieldLabel label="Description" />
            <TextField
              placeholder="Add any notes about this maintenance…"
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

          <DropdownField
            label="Zone"
            placeholder="Select zone"
            options={options.zones}
            value={values.zone}
            onChange={next => set('zone', next)}
            searchable={false}
          />

          <View style={styles.field}>
            <FieldLabel label="Describe Location" />
            <TextField
              placeholder="e.g. North entrance, near bus stop"
              value={values.describeLocation}
              onChangeText={next => set('describeLocation', next)}
            />
          </View>

          <View style={styles.lastField}>
            <DropdownField
              label="Business Name"
              placeholder="Select business name"
              options={options.businessNames}
              value={values.businessName}
              onChange={next => set('businessName', next)}
            />
          </View>
        </View>

        {/* ---- Connected Elements ---- */}
        <AccordionSection title="Connected Elements">
          <DropdownField
            label="Fixture Name"
            placeholder="Select fixture"
            options={options.fixtures}
            value={values.fixture}
            onChange={next => set('fixture', next)}
            addLabel={onAddFixture ? 'Add Fixture' : undefined}
            onRequestAdd={onAddFixture}
          />
          <MultiDropdownField
            label="Incident"
            placeholder="Select incident"
            options={options.incidents}
            values={values.incidents}
            onChange={next => set('incidents', next)}
          />
          <MultiDropdownField
            label="Person of Interest"
            placeholder="Select person of interest"
            options={options.pois}
            values={values.pois}
            onChange={next => set('pois', next)}
          />
          <MultiDropdownField
            label="Equipment"
            placeholder="Select equipment"
            options={options.equipment}
            values={values.equipment}
            onChange={next => set('equipment', next)}
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
        title="Submit maintenance?"
        message={`Maintenance ${reference} will be created and added to your Work Log. You can edit it later from the details screen.`}
        confirmLabel="Submit"
        onConfirm={() => {
          setConfirmSubmit(false);
          onSubmit(values);
        }}
        onCancel={() => setConfirmSubmit(false)}
      />

      <ConfirmDialog
        visible={confirmDiscard}
        title="Discard this maintenance?"
        message="You have unsaved details. If you leave now, everything you entered on this form will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
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
  nested: {marginTop: theme.spacing.md},
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.md,
  },
  changeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
  },
  changeLocationText: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.primary,
  },
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

export default MaintenanceForm;

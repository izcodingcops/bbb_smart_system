import React, {useRef, useState} from 'react';
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
  AccordionSectionHandle,
  ConfirmDialog,
  DateTimeField,
  DropdownField,
  FieldLabel,
  formChrome,
  MultiDropdownField,
  SectionTabs,
  SectionTabItem,
  SegmentedButtons,
  TextField,
  Toast,
  UploadField,
} from '../../../components/ui';
import {
  ChevronLeftIcon,
  MapPinIcon,
  RefreshIcon,
  XIcon,
} from '../../../components/icons';
import {useSectionScrollTabs} from '../../../hooks/useSectionScrollTabs';
import {
  MaintenanceDetail,
  MaintenanceFormOptions,
  MaintenanceFormValues,
  MaintenancePriority,
} from '../../../types/maintenance';
import AssigneeToggle from './AssigneeToggle';
import {theme} from '../../../theme';

/** Fallback address when a record has none — matches the design's auto-fill. */
const DEFAULT_ADDRESS = 'Rue Des Hauteurs, Val-David, Quebec J0T 2N0, Canada';

const PRIORITY_OPTIONS = [
  {value: 'Low', label: 'Low'},
  {value: 'Medium', label: 'Medium'},
  {value: 'High', label: 'High'},
];

/** Section jump tabs, in the order the sections actually appear on screen. */
const SECTION_TABS: SectionTabItem[] = [
  {key: 'basic', label: 'Basic'},
  {key: 'other', label: 'Other'},
  {key: 'location', label: 'Location'},
  {key: 'connected', label: 'Connected'},
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
  onSubmit: (values: MaintenanceFormValues) => Promise<void>;
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
  /** Set when onSubmit rejects, so the form can report it without navigating away. */
  const [submitFailed, setSubmitFailed] = useState(false);

  const otherRef = useRef<AccordionSectionHandle>(null);
  const connectedRef = useRef<AccordionSectionHandle>(null);
  const {
    scrollRef,
    activeTab,
    tabsVisible,
    recordSectionY,
    handleScroll,
    handleScrollBeginDrag,
    handleMomentumScrollEnd,
    handleTabSelect,
  } = useSectionScrollTabs({
    sectionKeys: SECTION_TABS.map(tab => tab.key),
    onSelect: key => {
      if (key === 'other') {
        otherRef.current?.open();
      } else if (key === 'connected') {
        connectedRef.current?.open();
      }
    },
  });

  const set = <K extends keyof MaintenanceFormValues>(
    key: K,
    value: MaintenanceFormValues[K],
  ) => setValues(current => ({...current, [key]: value}));

  // Everything else is pre-seeded, so type is the only gate on submitting.
  const canSubmit = values.type.length > 0 && !isSubmitting;

  const title = mode === 'create' ? 'Create Maintenance' : 'Edit Maintenance';

  /**
   * The parent's mutation rejects on failure. Catching here rather than in each
   * parent means create and edit both report errors, and the form stays mounted
   * with the user's input intact so they can retry.
   */
  const runSubmit = async () => {
    try {
      await onSubmit(values);
    } catch {
      setSubmitFailed(true);
    }
  };

  return (
    <View style={formChrome.root}>
      <SafeAreaView edges={['top']} style={formChrome.topbar}>
        <View style={formChrome.topbarRow}>
          <TouchableOpacity
            style={formChrome.topbarButton}
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
          <View style={formChrome.topbarText}>
            <Text style={formChrome.title}>{title}</Text>
            <Text style={formChrome.reference}>{reference}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={formChrome.bodyWrap}>
        <ScrollView
          ref={scrollRef}
          style={formChrome.body}
          contentContainerStyle={formChrome.bodyContent}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}>
          {/* ---- Basic Details ---- */}
          <View style={formChrome.section} onLayout={recordSectionY('basic')}>
            <Text style={formChrome.sectionTitle}>Basic Details</Text>

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

            <View style={formChrome.field}>
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

            <View style={formChrome.lastField}>
              <FieldLabel label="Priority" required />
              <SegmentedButtons
                options={PRIORITY_OPTIONS}
                value={values.priority}
                onChange={next => set('priority', next as MaintenancePriority)}
              />
            </View>
          </View>

          {/* ---- Other Details ---- */}
          <AccordionSection
            ref={otherRef}
            title="Other Details"
            initiallyOpen
            onLayout={recordSectionY('other')}>
            <View style={formChrome.field}>
              <FieldLabel label="Description" />
              <TextField
                placeholder="Add any notes about this maintenance…"
                value={values.description}
                onChangeText={next => set('description', next)}
                multiline
                numberOfLines={4}
                style={formChrome.textarea}
              />
            </View>
            <UploadField
              label="Document"
              uris={values.documents}
              onChange={next => set('documents', next)}
            />
          </AccordionSection>

          {/* ---- Location Details ---- */}
          <View style={formChrome.section} onLayout={recordSectionY('location')}>
            <Text style={formChrome.sectionTitle}>Location Details</Text>

            <View style={formChrome.field}>
              <FieldLabel
                label="Address"
                required
                trailing={
                  <TouchableOpacity
                    style={formChrome.changeLocation}
                    activeOpacity={0.7}
                    onPress={() =>
                      Alert.alert(
                        'Coming soon',
                        'Picking a location on the map is not wired up yet.',
                      )
                    }>
                    <RefreshIcon size={14} color={theme.colors.primary} />
                    <Text style={formChrome.changeLocationText}>Change Location</Text>
                  </TouchableOpacity>
                }
              />
              <View style={formChrome.addressBox}>
                <MapPinIcon size={19} color={theme.colors.primary} />
                <Text style={formChrome.addressText}>{values.address}</Text>
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

            <View style={formChrome.field}>
              <FieldLabel label="Describe Location" />
              <TextField
                placeholder="e.g. North entrance, near bus stop"
                value={values.describeLocation}
                onChangeText={next => set('describeLocation', next)}
              />
            </View>

            <View style={formChrome.lastField}>
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
          <AccordionSection
            ref={connectedRef}
            title="Connected Elements"
            initiallyOpen
            onLayout={recordSectionY('connected')}>
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

        <SectionTabs
          tabs={SECTION_TABS}
          activeKey={activeTab}
          visible={tabsVisible}
          onSelect={handleTabSelect}
        />
      </View>

      <SafeAreaView edges={['bottom']} style={formChrome.footer}>
        <TouchableOpacity
          style={[formChrome.submit, !canSubmit && formChrome.submitDisabled]}
          activeOpacity={0.9}
          disabled={!canSubmit}
          onPress={() =>
            mode === 'create' ? setConfirmSubmit(true) : runSubmit()
          }>
          <Text style={formChrome.submitText}>{submitLabel}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmSubmit}
        title="Submit maintenance?"
        message={`Maintenance ${reference} will be created and added to your Work Log. You can edit it later from the details screen.`}
        confirmLabel="Submit"
        icon="check"
        iconTone="primary"
        confirmTone="primary"
        onConfirm={() => {
          setConfirmSubmit(false);
          runSubmit();
        }}
        onCancel={() => setConfirmSubmit(false)}
      />

      <ConfirmDialog
        visible={confirmDiscard}
        title="Discard this maintenance?"
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

      <Toast
        visible={submitFailed}
        title="Couldn't save"
        message="Something went wrong saving this request. Check your connection and try again."
        variant="danger"
        onDismiss={() => setSubmitFailed(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  nested: {marginTop: theme.spacing.md},
});

export default MaintenanceForm;

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import ScreenBackground from '../../../components/ScreenBackground';
import {GetUser} from '../../../redux/auth/selectors';
import {UserRole} from '../../../types/auth';
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
import AssigneeToggle, {AssigneeOption} from './AssigneeToggle';
import ChangeLocationSheet from './ChangeLocationSheet';
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

/**
 * Who each role may hand a request to. An ambassador routes it onward — to a
 * supervisor for triage, or straight to a department. A supervisor assigns it
 * to a person directly, including themselves, since a supervisor is also an
 * ambassador.
 */
const ASSIGNEE_OPTIONS: Record<UserRole, AssigneeOption[]> = {
  ambassador: [
    {kind: 'Supervisor', label: 'Supervisor'},
    {kind: 'Department', label: 'Department'},
  ],
  supervisor: [
    {kind: 'Ambassador', label: 'Ambassador'},
    {kind: 'Department', label: 'Department'},
    {kind: 'Me', label: 'Me'},
  ],
};

/** Create starts from device state; edit starts from the saved record. */
/**
 * `role` only affects a fresh form: a supervisor's options don't include
 * 'Supervisor', so defaulting to it would leave nothing selected. Editing an
 * existing record takes the kind from the record itself.
 */
export function buildInitialValues(
  options: MaintenanceFormOptions,
  detail?: MaintenanceDetail,
  role: UserRole = 'ambassador',
): MaintenanceFormValues {
  if (detail) {
    return {
      type: detail.type,
      requestedAt: detail.requestedAt,
      assigneeKind: detail.assigneeKind,
      department: detail.department,
      ambassador:
        detail.assigneeKind === 'Ambassador' || detail.assigneeKind === 'Me'
          ? detail.assignee?.name ?? null
          : null,
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
    assigneeKind: role === 'supervisor' ? 'Ambassador' : 'Supervisor',
    department: null,
    ambassador: null,
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

/** The Connected Elements fields that hold a list rather than a single value. */
type MultiSelectKey = 'incidents' | 'pois' | 'equipment';

/**
 * Lets the screen hosting this form select something a quick-create sheet just
 * made ("Save & Select"). It goes through a ref rather than a controlled
 * `values` prop so the form keeps owning its own state — remounting it with new
 * initial values would throw away everything else the user had typed.
 */
export interface MaintenanceFormHandle {
  /** Replaces the chosen fixture — the field holds one at a time. */
  selectFixture: (name: string) => void;
  /** Appends to the multi-selects, ignoring a value that's already chosen. */
  addIncident: (label: string) => void;
  addPoi: (name: string) => void;
  addEquipment: (name: string) => void;
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
  /** Takes the address currently on the form, to seed the new incident with. */
  onAddIncident?: (address: string) => void;
  onAddPoi?: () => void;
  onAddEquipment?: () => void;
}

const MaintenanceForm = forwardRef<MaintenanceFormHandle, Props>(({
  mode,
  reference,
  options,
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onClose,
  onAddFixture,
  onAddIncident,
  onAddPoi,
  onAddEquipment,
}, ref) => {
  const [values, setValues] = useState<MaintenanceFormValues>(initialValues);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [changeLocationOpen, setChangeLocationOpen] = useState(false);
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

  // Guarded against duplicates: the option lists are plain strings, so adding
  // the same name twice would render two identical chips the user can't tell
  // apart, and submit it twice.
  const appendTo = useCallback((key: MultiSelectKey, value: string) => {
    setValues(current =>
      current[key].includes(value)
        ? current
        : {...current, [key]: [...current[key], value]},
    );
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      selectFixture: (name: string) =>
        setValues(current => ({...current, fixture: name})),
      addIncident: (label: string) => appendTo('incidents', label),
      addPoi: (name: string) => appendTo('pois', name),
      addEquipment: (name: string) => appendTo('equipment', name),
    }),
    [appendTo],
  );

  // The only place this module branches on role. Read here and passed down as a
  // plain list, so AssigneeToggle stays role-agnostic.
  const user = GetUser();
  const role: UserRole = user?.role ?? 'ambassador';
  const selfName = user?.name ?? '';
  const assigneeOptions = useMemo(() => ASSIGNEE_OPTIONS[role], [role]);

  // An ambassador assignment is only meaningful once someone is picked; the
  // other kinds carry everything they need in the toggle itself.
  const assigneeChosen =
    values.assigneeKind !== 'Ambassador' || !!values.ambassador;
  const canSubmit = values.type.length > 0 && assigneeChosen && !isSubmitting;

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
    <ScreenBackground style={formChrome.root}>
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
                options={assigneeOptions}
                value={values.assigneeKind}
                onChange={kind => {
                  setValues(current => ({
                    ...current,
                    assigneeKind: kind,
                    // Drop whichever follow-up no longer applies, so a stale
                    // pick can't be submitted under a different kind.
                    department: kind === 'Department' ? current.department : null,
                    // 'Me' needs no picker — it resolves to the signed-in user.
                    ambassador:
                      kind === 'Ambassador'
                        ? current.ambassador
                        : kind === 'Me'
                          ? selfName
                          : null,
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
              {values.assigneeKind === 'Ambassador' ? (
                <View style={styles.nested}>
                  <DropdownField
                    label="Ambassador"
                    required
                    placeholder="Select ambassador"
                    options={options.ambassadors}
                    value={values.ambassador}
                    onChange={next => set('ambassador', next)}
                    searchable
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
                    onPress={() => setChangeLocationOpen(true)}>
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
              addLabel={onAddIncident ? 'Add Incident' : undefined}
              onRequestAdd={
                onAddIncident ? () => onAddIncident(values.address) : undefined
              }
            />
            <MultiDropdownField
              label="Person of Interest"
              placeholder="Select person of interest"
              options={options.pois}
              values={values.pois}
              onChange={next => set('pois', next)}
              addLabel={onAddPoi ? 'Add Person of Interest' : undefined}
              onRequestAdd={onAddPoi}
            />
            <MultiDropdownField
              label="Equipment"
              placeholder="Select equipment"
              options={options.equipment}
              values={values.equipment}
              onChange={next => set('equipment', next)}
              addLabel={onAddEquipment ? 'Add Equipment' : undefined}
              onRequestAdd={onAddEquipment}
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

      <ChangeLocationSheet
        visible={changeLocationOpen}
        onSelect={next => set('address', next)}
        onClose={() => setChangeLocationOpen(false)}
      />

      <Toast
        visible={submitFailed}
        title="Couldn't save"
        message="Something went wrong saving this request. Check your connection and try again."
        variant="danger"
        onDismiss={() => setSubmitFailed(false)}
      />
    </ScreenBackground>
  );
});

MaintenanceForm.displayName = 'MaintenanceForm';

const styles = StyleSheet.create({
  // RN doesn't collapse margins: DropdownField carries its own bottom margin
  // and so does the formChrome.field wrapping this, so the negative bottom
  // cancels one of them and leaves a single gap before the next field.
  // The nested DropdownField carries its own 16px bottom margin, which sits
  // inside this section's own 16px one. CSS would collapse those into a single
  // gap; RN adds them, so the negative bottom cancels the duplicate.
  nested: {marginTop: theme.spacing.md, marginBottom: -theme.spacing.lg},
});

export default MaintenanceForm;

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
  MapPinIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
  XIcon,
} from '../../../components/icons';
import {useSectionScrollTabs} from '../../../hooks/useSectionScrollTabs';
import {
  DispatchIncidentFormOptions,
  DispatchIncidentFormValues,
  DispatchIncidentPartyValues,
  DispatchIncidentVehicleValues,
  DispatchPriority,
} from '../../../types/dispatch';
import {theme} from '../../../theme';

/** Fallback address when the device has none — matches the design's auto-fill. */
const DEFAULT_ADDRESS = 'Rue Des Hauteurs, Val-David, Quebec J0T 2N0, Canada';

const PRIORITY_OPTIONS = [
  {value: 'Low', label: 'Low'},
  {value: 'Medium', label: 'Medium'},
  {value: 'High', label: 'High'},
];

const REPORT_STATUS_OPTIONS = [
  {value: 'Open', label: 'Open'},
  {value: 'In Progress', label: 'In Progress'},
  {value: 'Completed', label: 'Completed'},
];

const SUPERVISOR_STATUS_OPTIONS = [
  {value: 'In Progress', label: 'In Progress'},
  {value: 'Completed', label: 'Completed'},
];

const YES_NO_OPTIONS = [
  {value: 'yes', label: 'Yes'},
  {value: 'no', label: 'No'},
];

/** Section jump tabs, in the order the sections appear on screen. */
const SECTION_TABS: SectionTabItem[] = [
  {key: 'basic', label: 'Basic'},
  {key: 'location', label: 'Location'},
  {key: 'other', label: 'Other'},
  {key: 'police', label: 'Police'},
  {key: 'fire', label: 'Fire'},
  {key: 'ems', label: 'EMS'},
  {key: 'client', label: 'Client'},
  {key: 'parties', label: 'Parties'},
  {key: 'vehicles', label: 'Vehicles'},
  {key: 'connected', label: 'Connected'},
];

const EMPTY_PARTY: DispatchIncidentPartyValues = {
  name: '',
  type: '',
  organization: '',
  streetAddress: '',
  phone: '',
  email: '',
};

const EMPTY_VEHICLE: DispatchIncidentVehicleValues = {
  year: '',
  make: '',
  model: '',
  color: '',
  licenseNumber: '',
  images: [],
};

/**
 * The design starts Parties and Vehicles at one blank card each, so an
 * Ambassador who has one of either can fill it in without tapping Add first.
 */
export function buildInitialValues(
  options: DispatchIncidentFormOptions,
): DispatchIncidentFormValues {
  return {
    incidentType: '',
    occurredAt: new Date().toISOString(),
    outcome: '',
    priority: 'Low',

    address: DEFAULT_ADDRESS,
    describeLocation: '',
    zone: options.zones[0] ?? '',

    businessName: '',
    description: '',
    documents: [],
    reportStatus: 'Open',
    supervisorStatus: 'In Progress',

    policeInvolved: false,
    policeOfficerName: '',
    policeTimeCalled: null,
    policeTimeArrived: null,

    fireInvolved: false,
    fireEngineName: '',
    fireTimeCalled: null,
    fireTimeArrived: null,

    emsInvolved: false,
    emsCompanyName: '',
    emsResponderName: '',
    emsTimeCalled: null,
    emsTimeArrived: null,

    clientInvolved: false,
    clientName: '',

    parties: [{...EMPTY_PARTY}],
    vehicles: [{...EMPTY_VEHICLE}],

    fixture: '',
    connectedMaintenance: [],
    connectedPois: [],
    connectedEquipment: [],
  };
}

interface InvolvementProps {
  question: string;
  involved: boolean;
  onChange: (involved: boolean) => void;
  children: React.ReactNode;
}

/**
 * The design's Yes/No reveal. The fields stay mounted but unrendered when the
 * answer is No, and the mapper drops the whole block anyway — so flipping to
 * No and back does not silently resurrect stale text.
 */
const Involvement: React.FC<InvolvementProps> = ({
  question,
  involved,
  onChange,
  children,
}) => (
  <>
    <View style={involved ? formChrome.field : formChrome.lastField}>
      <FieldLabel label={question} />
      <SegmentedButtons
        options={YES_NO_OPTIONS}
        value={involved ? 'yes' : 'no'}
        onChange={next => onChange(next === 'yes')}
      />
    </View>
    {involved ? <>{children}</> : null}
  </>
);

interface RepeatableCardProps {
  label: string;
  /** Omitted on the only card — the design shows no delete until there are two. */
  onRemove?: () => void;
  children: React.ReactNode;
}

const RepeatableCard: React.FC<RepeatableCardProps> = ({
  label,
  onRemove,
  children,
}) => (
  <View style={styles.repeatCard}>
    <View style={styles.repeatTop}>
      <Text style={styles.repeatName}>{label}</Text>
      {onRemove ? (
        <TouchableOpacity
          style={styles.repeatDelete}
          activeOpacity={0.8}
          onPress={onRemove}>
          <TrashIcon size={16} color="#CF1322" />
        </TouchableOpacity>
      ) : null}
    </View>
    {children}
  </View>
);

const AddRowButton: React.FC<{label: string; onPress: () => void}> = ({
  label,
  onPress,
}) => (
  <TouchableOpacity style={styles.addRow} activeOpacity={0.8} onPress={onPress}>
    <PlusIcon size={15} color={theme.colors.primary} />
    <Text style={styles.addRowText}>{label}</Text>
  </TouchableOpacity>
);

interface Props {
  /** Display reference shown under the title, e.g. '#96211408'. */
  reference: string;
  options: DispatchIncidentFormOptions;
  initialValues: DispatchIncidentFormValues;
  isSubmitting: boolean;
  onSubmit: (values: DispatchIncidentFormValues) => Promise<void>;
  onClose: () => void;
}

const IncidentForm: React.FC<Props> = ({
  reference,
  options,
  initialValues,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [values, setValues] = useState<DispatchIncidentFormValues>(initialValues);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  /** Set when onSubmit rejects, so the form reports it without navigating away. */
  const [submitFailed, setSubmitFailed] = useState(false);

  /**
   * Every collapsed section needs a handle, so tapping its tab can open it
   * before the scroll lands — jumping to a closed accordion otherwise scrolls
   * to a header with nothing under it.
   */
  const otherRef = useRef<AccordionSectionHandle>(null);
  const policeRef = useRef<AccordionSectionHandle>(null);
  const fireRef = useRef<AccordionSectionHandle>(null);
  const emsRef = useRef<AccordionSectionHandle>(null);
  const clientRef = useRef<AccordionSectionHandle>(null);
  const partiesRef = useRef<AccordionSectionHandle>(null);
  const vehiclesRef = useRef<AccordionSectionHandle>(null);
  const connectedRef = useRef<AccordionSectionHandle>(null);

  const SECTION_HANDLES: Record<
    string,
    React.RefObject<AccordionSectionHandle | null>
  > = {
    other: otherRef,
    police: policeRef,
    fire: fireRef,
    ems: emsRef,
    client: clientRef,
    parties: partiesRef,
    vehicles: vehiclesRef,
    connected: connectedRef,
  };

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
    onSelect: key => SECTION_HANDLES[key]?.current?.open(),
  });

  const set = <K extends keyof DispatchIncidentFormValues>(
    key: K,
    value: DispatchIncidentFormValues[K],
  ) => setValues(current => ({...current, [key]: value}));

  const setParty = <K extends keyof DispatchIncidentPartyValues>(
    index: number,
    key: K,
    value: DispatchIncidentPartyValues[K],
  ) =>
    setValues(current => ({
      ...current,
      parties: current.parties.map((party, i) =>
        i === index ? {...party, [key]: value} : party,
      ),
    }));

  const setVehicle = <K extends keyof DispatchIncidentVehicleValues>(
    index: number,
    key: K,
    value: DispatchIncidentVehicleValues[K],
  ) =>
    setValues(current => ({
      ...current,
      vehicles: current.vehicles.map((vehicle, i) =>
        i === index ? {...vehicle, [key]: value} : vehicle,
      ),
    }));

  /**
   * The four fields the design marks required and does not pre-seed. Location
   * and Zone are required too, but both are seeded, so gating on them would
   * only ever mislead. !isSubmitting guards against a double-submit.
   */
  const canSubmit =
    values.incidentType.length > 0 &&
    values.outcome.length > 0 &&
    values.occurredAt.length > 0 &&
    values.priority.length > 0 &&
    !isSubmitting;

  /**
   * The parent's mutation rejects on failure. Catching here means the form
   * stays mounted with the user's input intact so they can retry — never
   * navigate away from unsaved input.
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
            onPress={() => setConfirmDiscard(true)}>
            <XIcon size={19} color="#3A3F46" />
          </TouchableOpacity>
          <View style={formChrome.topbarText}>
            <Text style={formChrome.title}>Create Incident</Text>
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
              label="Incident Type"
              required
              placeholder="Select incident type"
              options={options.incidentTypes}
              value={values.incidentType}
              onChange={next => set('incidentType', next)}
            />

            <DateTimeField
              label="Incident Date & Time"
              required
              value={values.occurredAt}
              onChange={next => set('occurredAt', next)}
              helpText="Auto-filled from your device — tap to adjust."
            />

            <DropdownField
              label="Outcome"
              required
              placeholder="Select outcome"
              options={options.outcomes}
              value={values.outcome}
              onChange={next => set('outcome', next)}
            />

            <View style={formChrome.lastField}>
              <FieldLabel label="Priority" required />
              <SegmentedButtons
                options={PRIORITY_OPTIONS}
                value={values.priority}
                onChange={next => set('priority', next as DispatchPriority)}
              />
            </View>
          </View>

          {/* ---- Location Details ---- */}
          <View style={formChrome.section} onLayout={recordSectionY('location')}>
            <Text style={formChrome.sectionTitle}>Location Details</Text>

            <View style={formChrome.field}>
              <FieldLabel
                label="Location"
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

            <View style={formChrome.field}>
              <FieldLabel label="Describe Location" />
              <TextField
                placeholder="Enter location"
                value={values.describeLocation}
                onChangeText={next => set('describeLocation', next)}
              />
            </View>

            <View style={formChrome.lastField}>
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
          <AccordionSection
            ref={otherRef}
            title="Other Details"
            onLayout={recordSectionY('other')}>
            <DropdownField
              label="Business Name"
              placeholder="Select business name"
              options={options.businessNames}
              value={values.businessName}
              onChange={next => set('businessName', next)}
              searchable
            />

            <View style={formChrome.field}>
              <FieldLabel label="Description" />
              <TextField
                placeholder="Enter description"
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

            <View style={formChrome.field}>
              <FieldLabel label="Report Status" />
              <SegmentedButtons
                options={REPORT_STATUS_OPTIONS}
                value={values.reportStatus}
                onChange={next => set('reportStatus', next)}
              />
            </View>

            <View style={formChrome.lastField}>
              <FieldLabel label="Supervisor Reviewed Status" />
              <SegmentedButtons
                options={SUPERVISOR_STATUS_OPTIONS}
                value={values.supervisorStatus}
                onChange={next => set('supervisorStatus', next)}
              />
            </View>
          </AccordionSection>

          {/* ---- About Police ---- */}
          <AccordionSection
            ref={policeRef}
            title="About Police"
            onLayout={recordSectionY('police')}>
            <Involvement
              question="Is Police Involved?"
              involved={values.policeInvolved}
              onChange={next => set('policeInvolved', next)}>
              <View style={formChrome.field}>
                <FieldLabel label="Officer Name" />
                <TextField
                  placeholder="Enter officer name"
                  value={values.policeOfficerName}
                  onChangeText={next => set('policeOfficerName', next)}
                />
              </View>
              <DateTimeField
                label="Time Called"
                value={values.policeTimeCalled ?? ''}
                onChange={next => set('policeTimeCalled', next)}
              />
              <DateTimeField
                label="Arrived Time"
                value={values.policeTimeArrived ?? ''}
                onChange={next => set('policeTimeArrived', next)}
              />
            </Involvement>
          </AccordionSection>

          {/* ---- About Fire Fighter ---- */}
          <AccordionSection
            ref={fireRef}
            title="About Fire Fighter"
            onLayout={recordSectionY('fire')}>
            <Involvement
              question="Is Fire Fighter Involved?"
              involved={values.fireInvolved}
              onChange={next => set('fireInvolved', next)}>
              <View style={formChrome.field}>
                <FieldLabel label="Fire Engine Name" />
                <TextField
                  placeholder="Enter fire engine name"
                  value={values.fireEngineName}
                  onChangeText={next => set('fireEngineName', next)}
                />
              </View>
              <DateTimeField
                label="Time Called"
                value={values.fireTimeCalled ?? ''}
                onChange={next => set('fireTimeCalled', next)}
              />
              <DateTimeField
                label="Arrived Time"
                value={values.fireTimeArrived ?? ''}
                onChange={next => set('fireTimeArrived', next)}
              />
            </Involvement>
          </AccordionSection>

          {/* ---- About EMS ---- */}
          <AccordionSection
            ref={emsRef}
            title="About EMS"
            onLayout={recordSectionY('ems')}>
            <Involvement
              question="Is EMS Involved?"
              involved={values.emsInvolved}
              onChange={next => set('emsInvolved', next)}>
              <View style={formChrome.field}>
                <FieldLabel label="EMS Company Name" />
                <TextField
                  placeholder="Enter ems company name"
                  value={values.emsCompanyName}
                  onChangeText={next => set('emsCompanyName', next)}
                />
              </View>
              <View style={formChrome.field}>
                <FieldLabel label="EMS Responder Name" />
                <TextField
                  placeholder="Enter ems responder name"
                  value={values.emsResponderName}
                  onChangeText={next => set('emsResponderName', next)}
                />
              </View>
              <DateTimeField
                label="Time Called"
                value={values.emsTimeCalled ?? ''}
                onChange={next => set('emsTimeCalled', next)}
              />
              <DateTimeField
                label="Arrived Time"
                value={values.emsTimeArrived ?? ''}
                onChange={next => set('emsTimeArrived', next)}
              />
            </Involvement>
          </AccordionSection>

          {/* ---- About Client ---- */}
          <AccordionSection
            ref={clientRef}
            title="About Client"
            onLayout={recordSectionY('client')}>
            <Involvement
              question="Is Client Involved?"
              involved={values.clientInvolved}
              onChange={next => set('clientInvolved', next)}>
              <View style={formChrome.lastField}>
                <FieldLabel label="Client Name" />
                <TextField
                  placeholder="Enter client name"
                  value={values.clientName}
                  onChangeText={next => set('clientName', next)}
                />
              </View>
            </Involvement>
          </AccordionSection>

          {/* ---- Parties Details ---- */}
          <AccordionSection
            ref={partiesRef}
            title="Parties Details"
            onLayout={recordSectionY('parties')}>
            {values.parties.map((party, index) => (
              <RepeatableCard
                key={`party-${index}`}
                label={`Party ${index + 1}`}
                onRemove={
                  values.parties.length > 1
                    ? () =>
                        set(
                          'parties',
                          values.parties.filter((_, i) => i !== index),
                        )
                    : undefined
                }>
                <View style={formChrome.field}>
                  <FieldLabel label="Name" />
                  <TextField
                    placeholder="Enter name"
                    value={party.name}
                    onChangeText={next => setParty(index, 'name', next)}
                  />
                </View>
                <DropdownField
                  label="Party Type"
                  placeholder="Select party type"
                  options={options.partyTypes}
                  value={party.type}
                  onChange={next => setParty(index, 'type', next)}
                  searchable={false}
                />
                <View style={formChrome.field}>
                  <FieldLabel label="Business / ORG" />
                  <TextField
                    placeholder="Enter business / org"
                    value={party.organization}
                    onChangeText={next => setParty(index, 'organization', next)}
                  />
                </View>
                <View style={formChrome.field}>
                  <FieldLabel label="Street Address" />
                  <TextField
                    placeholder="Enter street address"
                    value={party.streetAddress}
                    onChangeText={next => setParty(index, 'streetAddress', next)}
                  />
                </View>
                <View style={formChrome.field}>
                  <FieldLabel label="Phone No" />
                  <TextField
                    placeholder="Enter phone no"
                    keyboardType="phone-pad"
                    value={party.phone}
                    onChangeText={next => setParty(index, 'phone', next)}
                  />
                </View>
                <View style={formChrome.lastField}>
                  <FieldLabel label="Email" />
                  <TextField
                    placeholder="Enter email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={party.email}
                    onChangeText={next => setParty(index, 'email', next)}
                  />
                </View>
              </RepeatableCard>
            ))}
            <AddRowButton
              label="Add New Party"
              onPress={() => set('parties', [...values.parties, {...EMPTY_PARTY}])}
            />
          </AccordionSection>

          {/* ---- Vehicle Details ---- */}
          <AccordionSection
            ref={vehiclesRef}
            title="Vehicle Details"
            onLayout={recordSectionY('vehicles')}>
            {values.vehicles.map((vehicle, index) => (
              <RepeatableCard
                key={`vehicle-${index}`}
                label={`Vehicle ${index + 1}`}
                onRemove={
                  values.vehicles.length > 1
                    ? () =>
                        set(
                          'vehicles',
                          values.vehicles.filter((_, i) => i !== index),
                        )
                    : undefined
                }>
                <View style={formChrome.field}>
                  <FieldLabel label="Year" />
                  <TextField
                    placeholder="2026"
                    keyboardType="number-pad"
                    value={vehicle.year}
                    onChangeText={next => setVehicle(index, 'year', next)}
                  />
                </View>
                <View style={formChrome.field}>
                  <FieldLabel label="Make" />
                  <TextField
                    placeholder="Enter make"
                    value={vehicle.make}
                    onChangeText={next => setVehicle(index, 'make', next)}
                  />
                </View>
                <View style={formChrome.field}>
                  <FieldLabel label="Model" />
                  <TextField
                    placeholder="Enter model"
                    value={vehicle.model}
                    onChangeText={next => setVehicle(index, 'model', next)}
                  />
                </View>
                <View style={formChrome.field}>
                  <FieldLabel label="Color" />
                  <TextField
                    placeholder="Enter color"
                    value={vehicle.color}
                    onChangeText={next => setVehicle(index, 'color', next)}
                  />
                </View>
                <View style={formChrome.field}>
                  <FieldLabel label="License No" />
                  <TextField
                    placeholder="Enter license no"
                    value={vehicle.licenseNumber}
                    onChangeText={next => setVehicle(index, 'licenseNumber', next)}
                  />
                </View>
                <UploadField
                  label="Vehicle Images"
                  title="Upload image"
                  uris={vehicle.images}
                  onChange={next => setVehicle(index, 'images', next)}
                />
              </RepeatableCard>
            ))}
            <AddRowButton
              label="Add Vehicle"
              onPress={() => set('vehicles', [...values.vehicles, {...EMPTY_VEHICLE}])}
            />
          </AccordionSection>

          {/* ---- Connected Elements ---- */}
          <AccordionSection
            ref={connectedRef}
            title="Connected Elements"
            onLayout={recordSectionY('connected')}>
            <DropdownField
              label="Fixture Name"
              placeholder="Select fixture name"
              options={options.fixtures}
              value={values.fixture}
              onChange={next => set('fixture', next)}
              searchable
            />
            <MultiDropdownField
              label="Maintenance"
              placeholder="Select maintenance"
              options={options.maintenanceOptions}
              values={values.connectedMaintenance}
              onChange={next => set('connectedMaintenance', next)}
              searchable
            />
            <MultiDropdownField
              label="Person of Interest"
              placeholder="Select person of interest"
              options={options.poiOptions}
              values={values.connectedPois}
              onChange={next => set('connectedPois', next)}
              searchable
            />
            <MultiDropdownField
              label="Equipment"
              placeholder="Select equipment"
              options={options.equipmentOptions}
              values={values.connectedEquipment}
              onChange={next => set('connectedEquipment', next)}
              searchable
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
          onPress={() => setConfirmSubmit(true)}>
          <Text style={formChrome.submitText}>Save Incident</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmSubmit}
        title="Submit incident?"
        message={`Incident ${reference} will be created and attached to this dispatch.`}
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
        title="Discard this incident?"
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
        message="Something went wrong saving this incident. Check your connection and try again."
        variant="danger"
        onDismiss={() => setSubmitFailed(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  repeatCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F9FAFB',
  },
  repeatTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  repeatName: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.text,
  },
  repeatDelete: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF2F0',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  addRowText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.primary,
  },
});

export default IncidentForm;

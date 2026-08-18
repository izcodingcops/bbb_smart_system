import React, {useRef, useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import ScreenBackground from '../../../components/ScreenBackground';
import ChangeLocationSheet from '../../../components/ChangeLocationSheet';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  AccordionSection,
  AccordionSectionHandle,
  ConfirmDialog,
  DateTimeField,
  DropdownField,
  FieldLabel,
  formChrome,
  SectionTabs,
  SectionTabItem,
  SegmentedButtons,
  TextField,
  Toast,
  UploadField,
} from '../../../components/ui';
import {ChevronLeftIcon, MapPinIcon, RefreshIcon, XIcon} from '../../../components/icons';
import {useSectionScrollTabs} from '../../../hooks/useSectionScrollTabs';
import {
  FixtureDetail,
  FixtureFormOptions,
  FixtureFormValues,
  FixtureStatus,
} from '../../../types/fixture';
import {theme} from '../../../theme';

/** Fallback address when a record has none — matches the design's auto-fill. */
const DEFAULT_ADDRESS = 'Rue Des Hauteurs, Val-David, Quebec J0T 2N0, Canada';

const STATUS_OPTIONS = [
  {value: 'Active', label: 'Active'},
  {value: 'Inactive', label: 'Inactive'},
];

/** Section jump tabs, in the order the sections actually appear on screen. */
const SECTION_TABS: SectionTabItem[] = [
  {key: 'basic', label: 'Basic'},
  {key: 'location', label: 'Location'},
  {key: 'other', label: 'Other'},
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
  onSubmit: (values: FixtureFormValues) => Promise<void>;
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
  const [changeLocationOpen, setChangeLocationOpen] = useState(false);
  /** Set when onSubmit rejects, so the form can report it without navigating away. */
  const [submitFailed, setSubmitFailed] = useState(false);

  const otherRef = useRef<AccordionSectionHandle>(null);
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
      }
    },
  });

  const set = <K extends keyof FixtureFormValues>(
    key: K,
    value: FixtureFormValues[K],
  ) => setValues(current => ({...current, [key]: value}));

  // Title + Fixture Type gate submit; Status/Zone/Service Date/Address are
  // pre-seeded, and !isSubmitting guards against double-submit.
  const canSubmit =
    values.title.trim().length > 0 && values.fixtureType.length > 0 && !isSubmitting;

  const title = mode === 'create' ? 'Create Fixture' : 'Edit Fixture';

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

            <View style={formChrome.field}>
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

            <View style={formChrome.lastField}>
              <FieldLabel label="Status" required />
              <SegmentedButtons
                options={STATUS_OPTIONS}
                value={values.status}
                onChange={next => set('status', next as FixtureStatus)}
              />
            </View>
          </View>

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

            <View style={formChrome.field}>
              <FieldLabel label="Describe Location" />
              <TextField
                placeholder="e.g. USA — north plaza"
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
            initiallyOpen
            onLayout={recordSectionY('other')}>
            <View style={formChrome.field}>
              <FieldLabel label="Description" />
              <TextField
                placeholder="Add any notes about this fixture…"
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
        title="Submit fixture?"
        message={`Fixture ${reference} will be created and added to your Work Log. You can edit it later from the details screen.`}
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

      <Toast
        visible={submitFailed}
        title="Couldn't save"
        message="Something went wrong saving this fixture. Check your connection and try again."
        variant="danger"
        onDismiss={() => setSubmitFailed(false)}
      />

      <ChangeLocationSheet
        visible={changeLocationOpen}
        onSelect={next => set('address', next)}
        onClose={() => setChangeLocationOpen(false)}
      />
    </ScreenBackground>
  );
};

export default FixtureForm;

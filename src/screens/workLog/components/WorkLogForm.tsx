import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import ScreenBackground from '../../../components/ScreenBackground';
import ChangeLocationSheet from '../../../components/ChangeLocationSheet';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ConfirmDialog,
  DateTimeField,
  DropdownField,
  FieldLabel,
  SectionTabs,
  SectionTabItem,
  SegmentedButtons,
  TextField,
  Toast,
} from '../../../components/ui';
import {ChevronLeftIcon, MapPinIcon, RefreshIcon, XIcon} from '../../../components/icons';
import {useSectionScrollTabs} from '../../../hooks/useSectionScrollTabs';
import {WorkLogFormOptions, WorkLogFormValues, YesNo} from '../../../types/workLog';
import {theme} from '../../../theme';
import {workLogCopy} from '../shiftText';
import EntryReadout from './EntryReadout';
import QuantityStepper from './QuantityStepper';

/** Fallback address when a record has none — matches the design's auto-fill. */
const DEFAULT_ADDRESS = 'Rue Des Hauteurs, Val-David, Quebec J0T 2N0, Canada';

const YES_NO_OPTIONS = [
  {value: 'yes', label: 'Yes'},
  {value: 'no', label: 'No'},
];

const SECTION_TABS: SectionTabItem[] = [
  {key: 'basic', label: 'Basic Details'},
  {key: 'location', label: 'Location Details'},
];

export function buildInitialValues(entryType: string): WorkLogFormValues {
  return {
    entryType,
    machineNo: '',
    requestDateTime: new Date().toISOString(),
    fvmAccessibilityChecked: null,
    bridgePlateSecured: null,
    accessibleFareGateWorking: null,
    automaticDoorWorking: null,
    fvmNotWorking: null,
    address: DEFAULT_ADDRESS,
    zone: null,
    describeLocation: '',
    businessName: null,
    quantity: '01',
  };
}

interface Props {
  mode: 'create' | 'edit';
  shiftTypeName: string;
  shiftTypeIcon: string;
  /** Display reference shown under the title, e.g. '#76231707'. */
  reference: string;
  options: WorkLogFormOptions;
  /**
   * Controlled rather than an `initialValues` the form owns internally: in
   * create mode, going Back to Step 1 unmounts this component, so its own
   * state wouldn't survive a Back → Next round trip — the parent has to hold
   * it instead.
   */
  values: WorkLogFormValues;
  onChangeValues: (values: WorkLogFormValues) => void;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: WorkLogFormValues) => Promise<void>;
  onClose: () => void;
  /** Create mode only — returns to the Step 1 entry-type picker. */
  onBack?: () => void;
}

const isAnswered = (v: YesNo | null): v is YesNo => v !== null;

const WorkLogForm: React.FC<Props> = ({
  mode,
  shiftTypeName,
  shiftTypeIcon,
  reference,
  options,
  values,
  onChangeValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onClose,
  onBack,
}) => {
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [changeLocationOpen, setChangeLocationOpen] = useState(false);
  /** Set when onSubmit rejects, so the form can report it without navigating away. */
  const [submitFailed, setSubmitFailed] = useState(false);

  const copy = workLogCopy(shiftTypeName);

  const {
    scrollRef,
    activeTab,
    tabsVisible,
    recordSectionY,
    handleScroll,
    handleScrollBeginDrag,
    handleMomentumScrollEnd,
    handleTabSelect,
  } = useSectionScrollTabs({sectionKeys: SECTION_TABS.map(tab => tab.key)});

  const set = <K extends keyof WorkLogFormValues>(
    key: K,
    value: WorkLogFormValues[K],
  ) => onChangeValues({...values, [key]: value});

  const canSubmit =
    values.machineNo.trim().length > 0 &&
    isAnswered(values.fvmAccessibilityChecked) &&
    isAnswered(values.bridgePlateSecured) &&
    isAnswered(values.accessibleFareGateWorking) &&
    isAnswered(values.automaticDoorWorking) &&
    isAnswered(values.fvmNotWorking) &&
    !isSubmitting;

  const title = mode === 'create' ? copy.createTitle : `Edit ${shiftTypeName} Work`;

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
    <ScreenBackground style={styles.root}>
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

      {mode === 'create' ? (
        <View style={styles.stepper}>
          <Text style={styles.stepLabel}>
            Step <Text style={styles.stepLabelBold}>02</Text> / 02
          </Text>
          <View style={styles.track}>
            <View style={[styles.trackFill, {width: '100%'}]} />
          </View>
        </View>
      ) : null}

      <View style={styles.bodyWrap}>
        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}>
          <EntryReadout
            shiftTypeIcon={shiftTypeIcon}
            entryBadgeLabel={copy.entryBadgeLabel}
            entryType={values.entryType}
          />

          {/* ---- Basic Details ---- */}
          <View style={styles.section} onLayout={recordSectionY('basic')}>
            <Text style={styles.sectionTitle}>Basic Details</Text>

            <View style={styles.field}>
              <FieldLabel label="Machine No" required />
              <TextField
                placeholder="Enter machine no"
                value={values.machineNo}
                onChangeText={next => set('machineNo', next)}
              />
              <Text style={styles.fieldHelp}>Add an eight-digit number.</Text>
            </View>

            <DateTimeField
              label="Request Date & Time"
              required
              value={values.requestDateTime}
              onChange={next => set('requestDateTime', next)}
            />

            <View style={styles.field}>
              <FieldLabel label="FVM Accessibility Features Checked?" required />
              <SegmentedButtons
                options={YES_NO_OPTIONS}
                value={values.fvmAccessibilityChecked ?? ''}
                onChange={next => set('fvmAccessibilityChecked', next as YesNo)}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel label="Bridge Plate Secured When You Arrived?" required />
              <SegmentedButtons
                options={YES_NO_OPTIONS}
                value={values.bridgePlateSecured ?? ''}
                onChange={next => set('bridgePlateSecured', next as YesNo)}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel label="Accessible Fare Gate Working?" required />
              <SegmentedButtons
                options={YES_NO_OPTIONS}
                value={values.accessibleFareGateWorking ?? ''}
                onChange={next => set('accessibleFareGateWorking', next as YesNo)}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel label="Automatic Door Working?" required />
              <SegmentedButtons
                options={YES_NO_OPTIONS}
                value={values.automaticDoorWorking ?? ''}
                onChange={next => set('automaticDoorWorking', next as YesNo)}
              />
            </View>

            <View style={styles.lastField}>
              <FieldLabel label="FVM Not Working?" required />
              <SegmentedButtons
                options={YES_NO_OPTIONS}
                value={values.fvmNotWorking ?? ''}
                onChange={next => set('fvmNotWorking', next as YesNo)}
              />
            </View>
          </View>

          {/* ---- Location Details ---- */}
          <View style={styles.section} onLayout={recordSectionY('location')}>
            <Text style={styles.sectionTitle}>Location Details</Text>

            <View style={styles.field}>
              <FieldLabel
                label="Address"
                required
                trailing={
                  <TouchableOpacity
                    style={styles.changeLocation}
                    activeOpacity={0.7}
                    onPress={() => setChangeLocationOpen(true)}>
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
                placeholder="e.g. North entrance, near ticket machine"
                value={values.describeLocation}
                onChangeText={next => set('describeLocation', next)}
              />
            </View>

            <DropdownField
              label="Business Name"
              placeholder="Select business name"
              options={options.businessNames}
              value={values.businessName}
              onChange={next => set('businessName', next)}
              searchable={false}
            />

            <View style={styles.lastField}>
              <QuantityStepper
                label="Quantity"
                value={values.quantity}
                onChange={next => set('quantity', next)}
              />
            </View>
          </View>
        </ScrollView>

        <SectionTabs
          tabs={SECTION_TABS}
          activeKey={activeTab}
          visible={tabsVisible}
          onSelect={handleTabSelect}
        />
      </View>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.footerRow}>
          {mode === 'create' && onBack ? (
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.9}
              onPress={onBack}>
              <ChevronLeftIcon size={18} color="#3A3F46" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
            activeOpacity={0.9}
            disabled={!canSubmit}
            onPress={() => setConfirmSubmit(true)}>
            <Text style={styles.submitText}>{submitLabel}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmSubmit}
        title={
          mode === 'create' ? copy.saveDialogTitle(reference) : 'Update this record?'
        }
        message={
          mode === 'create'
            ? copy.saveDialogMessage(reference, values.entryType)
            : `${reference} will be updated with your changes.`
        }
        confirmLabel={submitLabel}
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
        title={copy.discardDialogTitle}
        message={copy.discardDialogMessage}
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
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
        message="Something went wrong saving this record. Check your connection and try again."
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

const styles = StyleSheet.create({
  root: {flex: 1},
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
  stepper: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  stepLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  stepLabelBold: {fontFamily: theme.fonts.black, color: theme.colors.text},
  track: {height: 6, borderRadius: 99, backgroundColor: '#E7E9ED', overflow: 'hidden'},
  trackFill: {height: '100%', borderRadius: 99, backgroundColor: theme.colors.primary},
  bodyWrap: {flex: 1},
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
  fieldHelp: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textMuted,
    marginTop: 7,
  },
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
  footerRow: {flexDirection: 'row', gap: theme.spacing.md, marginBottom: 13},
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 54,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 15,
    backgroundColor: '#F0F1F4',
  },
  backButtonText: {fontFamily: theme.fonts.black, fontSize: 15, color: '#3A3F46'},
  submit: {
    flex: 1,
    height: 54,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  submitDisabled: {opacity: 0.45},
  submitText: {
    fontFamily: theme.fonts.black,
    fontSize: 16,
    letterSpacing: 0.2,
    color: theme.colors.white,
  },
});

export default WorkLogForm;

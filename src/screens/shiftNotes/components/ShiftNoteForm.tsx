import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../../../components/ScreenBackground';
import {
  ConfirmDialog,
  DateTimeField,
  DropdownField,
  FieldLabel,
  formChrome,
  MultiDropdownField,
  SectionTabs,
  SectionTabItem,
  SegmentedButtons,
  SegmentOption,
  TextField,
  Toast,
} from '../../../components/ui';
import {XIcon} from '../../../components/icons';
import {useFormDiscardState} from '../../../hooks/useFormDiscardState';
import {useSectionScrollTabs} from '../../../hooks/useSectionScrollTabs';
import {
  ShiftNoteFormOptions,
  ShiftNoteFormValues,
  ShiftNotePriority,
} from '../../../types/shiftNote';
import {recipientsLabel} from './recipients';
import {theme} from '../../../theme';

/** Section jump tabs, in the order the sections appear on screen. */
const SECTION_TABS: SectionTabItem[] = [
  {key: 'basic', label: 'Basic'},
  {key: 'note', label: 'Briefing Note'},
];

const SEND_ALL_OPTIONS: SegmentOption[] = [
  {value: 'yes', label: 'Yes'},
  {value: 'no', label: 'No'},
];

/**
 * Each priority carries its own selected colour — the design's semantic
 * priority palette, so raising a brief to High reads red without the user
 * having to parse the label.
 */
const PRIORITY_OPTIONS: SegmentOption[] = [
  {value: 'Low', label: 'Low', tone: 'success'},
  {value: 'Medium', label: 'Medium', tone: 'warning'},
  {value: 'High', label: 'High', tone: 'danger'},
];

/**
 * A fresh note starts from device state: now, the first zone, and a brief that
 * goes to the whole zone at Low priority. The design presents the first two as
 * auto-filled and changeable, which is what the help text under each says.
 */
export function buildInitialValues(
  options: ShiftNoteFormOptions,
): ShiftNoteFormValues {
  return {
    shiftTypes: [],
    sentAt: new Date().toISOString(),
    zone: options.zones[0] ?? '',
    sendToAll: true,
    ambassador: '',
    priority: 'Low',
    title: '',
    description: '',
  };
}

/** Control summary for the Shift Type picker. */
function summarizeShiftTypes(values: string[], options: string[]): string {
  return values.length === options.length
    ? 'All shift types'
    : `${values.length} selected`;
}

interface Props {
  /** Display reference shown under the title, e.g. '#SHN-0442'. */
  reference: string;
  options: ShiftNoteFormOptions;
  isSubmitting: boolean;
  onSubmit: (values: ShiftNoteFormValues) => Promise<void>;
  onClose: () => void;
}

const ShiftNoteForm: React.FC<Props> = ({
  reference,
  options,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [values, setValues] = useState<ShiftNoteFormValues>(() =>
    buildInitialValues(options),
  );
  const {
    setTouched,
    confirmSubmit,
    setConfirmSubmit,
    confirmDiscard,
    setConfirmDiscard,
    submitFailed,
    setSubmitFailed,
    handleClose,
    confirmDiscardAndClose,
  } = useFormDiscardState(onClose);

  // Both sections are always open, so nothing has to be expanded before a tab
  // can scroll to it — no onSelect, unlike the accordion-bearing forms.
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
  });

  const set = <K extends keyof ShiftNoteFormValues>(
    key: K,
    value: ShiftNoteFormValues[K],
  ) => {
    setTouched(true);
    setValues(current => ({...current, [key]: value}));
  };

  /**
   * Switching back to "send to all" hides the ambassador field but deliberately
   * leaves the pick in state, so flipping No → Yes → No shows it again rather
   * than blanking it. The wire mapper is what stops a hidden ambassador
   * reaching the store.
   */
  const setSendToAll = (next: string) => set('sendToAll', next === 'yes');

  const needsAmbassador = !values.sendToAll;

  const canSubmit =
    values.shiftTypes.length > 0 &&
    values.zone.length > 0 &&
    values.sentAt.length > 0 &&
    (!needsAmbassador || values.ambassador.length > 0) &&
    values.title.trim().length > 0 &&
    values.description.trim().length > 0 &&
    !isSubmitting;

  /**
   * The parent's mutation rejects on failure. Catching here keeps the form
   * mounted with every field intact so it can be retried — never navigate away
   * from unsaved input.
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
            onPress={handleClose}>
            <XIcon size={19} color="#3A3F46" />
          </TouchableOpacity>
          <View style={formChrome.topbarText}>
            <Text style={formChrome.title}>Create New Shift Notes</Text>
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

            <MultiDropdownField
              label="Shift Type"
              required
              placeholder="Select shift types"
              options={options.shiftTypes}
              values={values.shiftTypes}
              onChange={next => set('shiftTypes', next)}
              summarize={summarizeShiftTypes}
              selectAllLabel="Select all"
            />

            <DateTimeField
              label="Date & Time"
              required
              value={values.sentAt}
              onChange={next => set('sentAt', next)}
              helpText="Auto-filled from your device — tap to adjust."
            />

            <DropdownField
              label="Zone"
              required
              placeholder="Select zone"
              options={options.zones}
              value={values.zone}
              onChange={next => set('zone', next)}
              searchable
              helperText="Auto-detected from your location — change it to brief another zone."
            />

            <View style={formChrome.field}>
              <FieldLabel
                label="Send to all ambassadors in selected zone?"
                required
              />
              <SegmentedButtons
                options={SEND_ALL_OPTIONS}
                value={values.sendToAll ? 'yes' : 'no'}
                onChange={setSendToAll}
              />
            </View>

            {needsAmbassador ? (
              <DropdownField
                label="Ambassador"
                required
                placeholder="Select ambassador"
                options={options.ambassadors}
                value={values.ambassador}
                onChange={next => set('ambassador', next)}
                searchable
                helperText="Only this ambassador receives the brief note."
              />
            ) : null}

            <View style={formChrome.lastField}>
              <FieldLabel label="Priority" required />
              <SegmentedButtons
                options={PRIORITY_OPTIONS}
                value={values.priority}
                onChange={next => set('priority', next as ShiftNotePriority)}
              />
            </View>
          </View>

          {/* ---- Briefing Note ---- */}
          <View style={formChrome.section} onLayout={recordSectionY('note')}>
            <Text style={formChrome.sectionTitle}>Briefing Note</Text>

            <View style={formChrome.field}>
              <FieldLabel label="Title" required />
              <TextField
                placeholder="Enter a short headline"
                value={values.title}
                onChangeText={next => set('title', next)}
              />
            </View>

            <View style={formChrome.lastField}>
              <FieldLabel label="Description" required />
              <TextField
                placeholder="What does the team need to know before the shift starts?"
                value={values.description}
                onChangeText={next => set('description', next)}
                multiline
                numberOfLines={4}
                style={formChrome.textarea}
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

      <SafeAreaView edges={['bottom']} style={formChrome.footer}>
        <TouchableOpacity
          style={[formChrome.submit, !canSubmit && formChrome.submitDisabled]}
          activeOpacity={0.9}
          disabled={!canSubmit}
          onPress={() => setConfirmSubmit(true)}>
          <Text style={formChrome.submitText}>Send Brief Note</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmSubmit}
        title="Send this brief note?"
        message={
          <Text>
            Brief note <Text style={styles.bold}>{reference}</Text> will be
            shared with{' '}
            <Text style={styles.bold}>{recipientsLabel(values)}</Text> and
            pushed to their device right away.
          </Text>
        }
        confirmLabel="Send"
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
        title="Discard this brief note?"
        message="You have unsaved details. If you leave now, the shift types, recipients and briefing note on this form will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        onConfirm={confirmDiscardAndClose}
        onCancel={() => setConfirmDiscard(false)}
      />

      <Toast
        visible={submitFailed}
        title="Couldn't send"
        message="Something went wrong sending this brief note. Check your connection and try again."
        variant="danger"
        onDismiss={() => setSubmitFailed(false)}
      />
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  bold: {fontFamily: theme.fonts.black},
});

export default ShiftNoteForm;

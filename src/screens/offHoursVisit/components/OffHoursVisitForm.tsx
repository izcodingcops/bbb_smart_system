import React, {useCallback, useMemo, useRef, useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../../../components/ScreenBackground';
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
  TextField,
  Toast,
} from '../../../components/ui';
import {LockIcon, XIcon} from '../../../components/icons';
import {useFormDiscardState} from '../../../hooks/useFormDiscardState';
import {useSectionScrollTabs} from '../../../hooks/useSectionScrollTabs';
import {
  OffHoursQuestion,
  OffHoursVisitFormOptions,
  OffHoursVisitFormValues,
} from '../../../types/offHoursVisit';
import ChecklistQuestion from './ChecklistQuestion';
import RatingBadge from './RatingBadge';
import {theme} from '../../../theme';

/** Section jump tabs, in the order the sections appear on screen. */
const SECTION_TABS: SectionTabItem[] = [
  {key: 'basic', label: 'Basic'},
  {key: 'checklist', label: 'Checklist'},
  {key: 'other', label: 'Other'},
];

/**
 * A fresh visit starts from device state: now, and the first zone. The design
 * presents both as auto-filled and changeable, which is what the help text
 * under each field says.
 */
export function buildInitialValues(
  options: OffHoursVisitFormOptions,
): OffHoursVisitFormValues {
  return {
    capturedAt: new Date().toISOString(),
    zone: options.zones[0] ?? '',
    answers: {},
    notes: {},
    images: {},
    auditNotes: '',
  };
}

/** Sum of the points behind the current answers. */
function scoreOf(
  questions: OffHoursQuestion[],
  answers: Record<string, string>,
): number {
  return questions.reduce((total, question) => {
    const option = question.options.find(o => o.label === answers[question.key]);
    return total + (option?.points ?? 0);
  }, 0);
}

/**
 * The best a report can score. Derived from the served questions rather than
 * written down, so the denominator follows the checklist rather than drifting
 * from it.
 */
function maxScoreOf(questions: OffHoursQuestion[]): number {
  return questions.reduce(
    (total, question) =>
      total + question.options.reduce((best, o) => Math.max(best, o.points), 0),
    0,
  );
}

interface Props {
  /** Display reference shown under the title, e.g. '#OHV-1187'. */
  reference: string;
  options: OffHoursVisitFormOptions;
  isSubmitting: boolean;
  onSubmit: (values: OffHoursVisitFormValues) => Promise<void>;
  onClose: () => void;
}

const OffHoursVisitForm: React.FC<Props> = ({
  reference,
  options,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [values, setValues] = useState<OffHoursVisitFormValues>(() =>
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

  /** Other Details is collapsed, so its tab has to open it before scrolling. */
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

  const set = <K extends keyof OffHoursVisitFormValues>(
    key: K,
    value: OffHoursVisitFormValues[K],
  ) => {
    setTouched(true);
    setValues(current => ({...current, [key]: value}));
  };

  /*
   * One handler per map, keyed by question, rather than five closures each —
   * these have to keep a stable identity or the memoized question blocks
   * re-render on every keystroke in any of them.
   */
  const handleAnswer = useCallback(
    (key: string, answer: string) => {
      setTouched(true);
      setValues(current => ({
        ...current,
        answers: {...current.answers, [key]: answer},
      }));
    },
    [setTouched],
  );

  const handleNote = useCallback(
    (key: string, note: string) => {
      setTouched(true);
      setValues(current => ({...current, notes: {...current.notes, [key]: note}}));
    },
    [setTouched],
  );

  const handleImages = useCallback(
    (key: string, images: string[]) => {
      setTouched(true);
      setValues(current => ({
        ...current,
        images: {...current.images, [key]: images},
      }));
    },
    [setTouched],
  );

  const rating = useMemo(
    () => scoreOf(options.questions, values.answers),
    [options.questions, values.answers],
  );
  const ratingMax = useMemo(
    () => maxScoreOf(options.questions),
    [options.questions],
  );

  /** Every question is required, and both auto-filled fields must survive. */
  const canSubmit =
    options.questions.every(q => (values.answers[q.key] ?? '').length > 0) &&
    values.zone.length > 0 &&
    values.capturedAt.length > 0 &&
    !isSubmitting;

  /**
   * The parent's mutation rejects on failure. Catching here keeps the form
   * mounted with every answer intact so it can be retried — never navigate
   * away from unsaved input.
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
            <Text style={formChrome.title}>Add New Off Hours</Text>
            <Text style={formChrome.reference}>{reference}</Text>
          </View>
          <RatingBadge value={rating} max={ratingMax} />
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

            <DateTimeField
              label="Date & Time Captured"
              required
              value={values.capturedAt}
              onChange={next => set('capturedAt', next)}
              helpText="Auto-filled from your device — tap to adjust."
            />

            <View style={formChrome.field}>
              <FieldLabel label="Type" required />
              <TextField
                value={options.type}
                editable={false}
                trailingIcon={<LockIcon size={17} color={theme.colors.textMuted} />}
              />
              <Text style={styles.help}>
                Locked — this form only records off-hours visits.
              </Text>
            </View>

            <View style={formChrome.lastField}>
              <DropdownField
                label="Zone"
                required
                placeholder="Select zone"
                options={options.zones}
                value={values.zone}
                onChange={next => set('zone', next)}
                searchable
              />
              <Text style={styles.help}>
                Auto-detected from your location — change it if you visited
                elsewhere.
              </Text>
            </View>
          </View>

          {/* ---- Off Hours Checklist ---- */}
          <View style={formChrome.section} onLayout={recordSectionY('checklist')}>
            <Text style={formChrome.sectionTitle}>Off Hours Checklist</Text>
            {options.questions.map((question, index) => (
              <ChecklistQuestion
                key={question.key}
                index={index}
                question={question}
                answer={values.answers[question.key] ?? ''}
                note={values.notes[question.key] ?? ''}
                images={values.images[question.key] ?? []}
                onAnswer={handleAnswer}
                onNote={handleNote}
                onImages={handleImages}
              />
            ))}
          </View>

          {/* ---- Other Details ---- */}
          <AccordionSection
            ref={otherRef}
            title="Other Details"
            onLayout={recordSectionY('other')}>
            <View style={formChrome.lastField}>
              <FieldLabel label="Audit Notes" />
              <TextField
                placeholder="Add notes"
                value={values.auditNotes}
                onChangeText={next => set('auditNotes', next)}
                multiline
                numberOfLines={4}
                style={formChrome.textarea}
              />
            </View>
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
          <Text style={formChrome.submitText}>Save</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmSubmit}
        title="Submit this off hours visit?"
        message={
          <Text>
            Off Hours Visit report <Text style={styles.bold}>{reference}</Text>{' '}
            will be submitted with a rating of{' '}
            <Text style={styles.bold}>
              {rating}/{ratingMax}
            </Text>
            . You’ll be able to review it on your portal.
          </Text>
        }
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
        title="Discard this off hours visit?"
        message="You have unsaved details. If you leave now, the answers, descriptions and images on this form will be lost."
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
        title="Couldn't save"
        message="Something went wrong saving this off hours visit. Check your connection and try again."
        variant="danger"
        onDismiss={() => setSubmitFailed(false)}
      />
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  help: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 6,
  },
  bold: {fontFamily: theme.fonts.black},
});

export default OffHoursVisitForm;

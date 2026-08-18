import React, {useCallback, useMemo, useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../../../components/ScreenBackground';
import {
  ConfirmDialog,
  DateTimeField,
  DropdownField,
  FieldLabel,
  formChrome,
  TextField,
  Toast,
  UploadField,
} from '../../../components/ui';
import {ChevronLeftIcon, StarIcon} from '../../../components/icons';
import {useFormDiscardState} from '../../../hooks/useFormDiscardState';
import {
  RvpSection,
  RvpSectionValues,
  RvpSiteVisitDetail,
  RvpSiteVisitFormOptions,
  RvpSiteVisitFormValues,
  RvpVisitType,
} from '../../../types/rvpSiteVisit';
import SectionCard from './SectionCard';
import SectionEditor from './SectionEditor';
import {theme} from '../../../theme';

/** The two types that make Reason for Visit required. */
const NEEDS_REASON: RvpVisitType[] = ['Drop In Visit', 'Special Purpose'];

const emptySection = (): RvpSectionValues => ({
  answers: {},
  notes: {},
  images: {},
  observed: {},
  howObserved: {},
  groupNotes: {},
  texts: {},
  saved: false,
});

function questionCountOf(section: RvpSection): number {
  return section.groups.reduce((n, g) => n + g.questions.length, 0);
}

export function buildInitialValues(
  options: RvpSiteVisitFormOptions,
): RvpSiteVisitFormValues {
  const today = new Date().toISOString();
  return {
    program: options.programs[0] ?? '',
    visitType: '',
    startDate: today,
    endDate: '',
    operationManager: '',
    reasonForVisit: '',
    images: [],
    sections: Object.fromEntries(
      options.sections.map(section => [section.key, emptySection()]),
    ),
  };
}

/**
 * Maps a stored report back onto question keys so it can be edited.
 *
 * The record denormalizes answers by prompt while form state is keyed by
 * question key, so this walks the served tree and the stored sections together:
 * groups by index within the section, questions by **prompt** within the group.
 * Prompt is safe as a key inside one group even though `field.g0` and
 * `field.g1` share the same four questions between them.
 *
 * Every lookup is guarded rather than asserted. A report filed against an older
 * question tree has to open for editing, not crash — it just won't carry
 * answers for questions that no longer exist.
 */
export function buildEditValues(
  options: RvpSiteVisitFormOptions,
  detail: RvpSiteVisitDetail,
): RvpSiteVisitFormValues {
  const storedByKey = new Map(detail.sections.map(s => [s.key, s]));

  return {
    program: detail.program,
    visitType: detail.visitType,
    startDate: detail.startDate,
    endDate: detail.endDate,
    operationManager: detail.operationManager,
    reasonForVisit: detail.reasonForVisit,
    images: detail.images,
    sections: Object.fromEntries(
      options.sections.map(section => {
        const stored = storedByKey.get(section.key);
        const values = emptySection();
        if (!stored) {
          return [section.key, values];
        }

        section.groups.forEach((group, groupIndex) => {
          const storedGroup = stored.groups[groupIndex];
          if (!storedGroup) {
            return;
          }
          if (group.requiresTime) {
            values.observed[group.key] = {
              from: storedGroup.observedFrom,
              to: storedGroup.observedTo,
            };
          }
          if (group.requiresHow) {
            values.howObserved[group.key] = storedGroup.howObserved;
          }
          if (group.notesLabel) {
            values.groupNotes[group.key] = storedGroup.notes;
          }

          const byPrompt = new Map(storedGroup.answers.map(a => [a.question, a]));
          group.questions.forEach(question => {
            const stored2 = byPrompt.get(question.prompt);
            if (!stored2) {
              return;
            }
            values.answers[question.key] = stored2.answer;
            values.notes[question.key] = stored2.note;
            values.images[question.key] = stored2.images;
          });
        });

        section.textPrompts.forEach((_, index) => {
          values.texts[index] = stored.texts[index]?.value ?? '';
        });

        // Everything already filed counts as saved, so an untouched section
        // doesn't read as "Not started" on a report that is complete.
        values.saved = true;
        return [section.key, values];
      }),
    ),
  };
}

interface Props {
  mode: 'create' | 'edit';
  reference: string;
  options: RvpSiteVisitFormOptions;
  initialValues: RvpSiteVisitFormValues;
  isSubmitting: boolean;
  onSubmit: (values: RvpSiteVisitFormValues) => Promise<void>;
  onClose: () => void;
}

const RvpSiteVisitForm: React.FC<Props> = ({
  mode,
  reference,
  options,
  initialValues,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [values, setValues] = useState(initialValues);
  const [openSection, setOpenSection] = useState<string | null>(null);
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

  const set = <K extends keyof RvpSiteVisitFormValues>(
    key: K,
    value: RvpSiteVisitFormValues[K],
  ) => {
    setTouched(true);
    setValues(current => ({...current, [key]: value}));
  };

  const handleSectionChange = useCallback(
    (key: string, update: (current: RvpSectionValues) => RvpSectionValues) => {
      setTouched(true);
      setValues(current => ({
        ...current,
        sections: {
          ...current.sections,
          [key]: update(current.sections[key] ?? emptySection()),
        },
      }));
    },
    [setTouched],
  );

  /**
   * Bound to whichever section is open, and stable while it stays open — the
   * editor's own per-question handlers depend on this identity, and through
   * them so does QuestionBlock's memo.
   */
  const handleOpenSectionChange = useCallback(
    (update: (current: RvpSectionValues) => RvpSectionValues) => {
      if (openSection) {
        handleSectionChange(openSection, update);
      }
    },
    [openSection, handleSectionChange],
  );

  const handleOpenSection = useCallback((key: string) => {
    setOpenSection(key);
  }, []);

  const totalQuestions = useMemo(
    () => options.sections.reduce((n, s) => n + questionCountOf(s), 0),
    [options.sections],
  );

  const score = useMemo(
    () =>
      Object.values(values.sections).reduce(
        (n, s) => n + Object.values(s.answers).filter(a => a === 'Yes').length,
        0,
      ),
    [values.sections],
  );

  const savedCount = useMemo(
    () => options.sections.filter(s => values.sections[s.key]?.saved).length,
    [options.sections, values.sections],
  );

  /** Sections still missing a save or an answer, by title, for the dialog. */
  const incomplete = useMemo(
    () =>
      options.sections
        .filter(section => {
          const state = values.sections[section.key];
          return (
            !state ||
            !state.saved ||
            Object.keys(state.answers).length < questionCountOf(section)
          );
        })
        .map(section => section.title),
    [options.sections, values.sections],
  );

  const needsReason = NEEDS_REASON.includes(values.visitType as RvpVisitType);

  /*
   * Deliberately does not require every section. The design's own submit dialog
   * offers "You can submit now and finish later" and lists what is missing — a
   * site visit is filed over days, so gating on all 74 answers would trap a
   * half-finished report on the device.
   */
  const canSubmit =
    values.program.length > 0 &&
    values.visitType.length > 0 &&
    values.startDate.length > 0 &&
    values.endDate.length > 0 &&
    values.operationManager.length > 0 &&
    (!needsReason || values.reasonForVisit.trim().length > 0) &&
    !isSubmitting;

  /**
   * The parent's mutation rejects on failure. Catching here keeps the form
   * mounted with every answer intact — never navigate away from unsaved input.
   */
  const runSubmit = async () => {
    try {
      await onSubmit(values);
    } catch {
      setSubmitFailed(true);
    }
  };

  const editing = openSection
    ? options.sections.find(s => s.key === openSection)
    : undefined;

  if (editing) {
    return (
      <SectionEditor
        section={editing}
        values={values.sections[editing.key] ?? emptySection()}
        onChange={handleOpenSectionChange}
        onSave={() => {
          handleSectionChange(editing.key, current => ({
            ...current,
            saved: true,
          }));
          setOpenSection(null);
        }}
        onClose={() => setOpenSection(null)}
      />
    );
  }

  return (
    <ScreenBackground style={formChrome.root}>
      <SafeAreaView edges={['top']} style={formChrome.topbar}>
        <View style={formChrome.topbarRow}>
          <TouchableOpacity
            style={formChrome.topbarButton}
            activeOpacity={0.8}
            onPress={handleClose}>
            <ChevronLeftIcon size={19} color="#3A3F46" />
          </TouchableOpacity>
          <View style={formChrome.topbarText}>
            <Text style={formChrome.title}>
              {mode === 'edit' ? 'Edit RVP Site Visit' : 'Create RVP Site Visit'}
            </Text>
            <Text style={formChrome.reference}>{reference}</Text>
          </View>
          <View style={styles.scoreBadge}>
            <StarIcon size={17} color="#F5A623" />
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreMax}>/{totalQuestions}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={formChrome.body}
        contentContainerStyle={formChrome.bodyContent}
        keyboardShouldPersistTaps="handled">
        <View style={formChrome.section}>
          <Text style={formChrome.sectionTitle}>Basic Details</Text>

          <DropdownField
            label="Program"
            required
            placeholder="Select program"
            options={options.programs}
            value={values.program}
            onChange={next => set('program', next)}
            searchable
          />

          <DropdownField
            label="Type of Visit"
            required
            placeholder="Select type of visit"
            options={options.visitTypes}
            value={values.visitType}
            onChange={next => set('visitType', next as RvpVisitType)}
          />

          <DateTimeField
            label="Start Date"
            required
            value={values.startDate}
            onChange={next => set('startDate', next)}
          />

          <DateTimeField
            label="End Date"
            required
            value={values.endDate}
            onChange={next => set('endDate', next)}
            placeholder="Date & Time"
          />

          <DropdownField
            label="Operation Manager"
            required
            placeholder="Add Operation Manager"
            options={options.operationManagers}
            value={values.operationManager}
            onChange={next => set('operationManager', next)}
            searchable
          />

          {/* Only these two visit types ask for one. Switching back to a full
              visit hides the field but keeps the text — the wire mapper drops
              it, so flipping back shows what was typed. */}
          {needsReason ? (
            <View style={formChrome.field}>
              <FieldLabel label="Reason for Visit" required />
              <TextField
                placeholder="Add reason for visit"
                value={values.reasonForVisit}
                onChangeText={next => set('reasonForVisit', next)}
                multiline
                numberOfLines={3}
                style={formChrome.textarea}
              />
            </View>
          ) : null}

          <UploadField
            label="Upload Image"
            title="Add Images"
            uris={values.images}
            onChange={next => set('images', next)}
          />
        </View>

        <View style={styles.sectionsHead}>
          <Text style={styles.sectionsTitle}>Observation Sections</Text>
          <Text style={styles.sectionsCount}>
            {savedCount} of {options.sections.length} saved
          </Text>
        </View>

        <View style={styles.sectionsList}>
          {options.sections.map(section => (
            <SectionCard
              key={section.key}
              section={section}
              values={values.sections[section.key]}
              questionCount={questionCountOf(section)}
              onPress={handleOpenSection}
            />
          ))}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={formChrome.footer}>
        <TouchableOpacity
          style={[formChrome.submit, !canSubmit && formChrome.submitDisabled]}
          activeOpacity={0.9}
          disabled={!canSubmit}
          onPress={() => setConfirmSubmit(true)}>
          <Text style={formChrome.submitText}>
            {mode === 'edit' ? 'Update Report' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmSubmit}
        title={mode === 'edit' ? 'Update this report?' : 'Submit this report?'}
        message={
          <Text>
            Score{' '}
            <Text style={styles.bold}>
              {score}/{totalQuestions}
            </Text>{' '}
            for{' '}
            <Text style={styles.bold}>
              {values.operationManager || 'the Operations Manager'}
            </Text>
            .
            {incomplete.length > 0 ? (
              <Text>
                {' '}
                <Text style={styles.bold}>
                  {incomplete.length} section
                  {incomplete.length > 1 ? 's' : ''}
                </Text>{' '}
                still incomplete: {incomplete.slice(0, 3).join(', ')}
                {incomplete.length > 3 ? '…' : ''}. You can submit now and
                finish later.
              </Text>
            ) : (
              <Text> All {options.sections.length} sections are complete.</Text>
            )}
          </Text>
        }
        confirmLabel={mode === 'edit' ? 'Update' : 'Submit'}
        icon={incomplete.length > 0 ? 'warning' : 'check'}
        iconTone={incomplete.length > 0 ? 'danger' : 'primary'}
        confirmTone="primary"
        onConfirm={() => {
          setConfirmSubmit(false);
          runSubmit();
        }}
        onCancel={() => setConfirmSubmit(false)}
      />

      <ConfirmDialog
        visible={confirmDiscard}
        title="Discard this report?"
        message={`Everything you've captured in the ${savedCount} saved section${
          savedCount === 1 ? '' : 's'
        } will be lost.`}
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
        message="Something went wrong saving this report. Check your connection and try again."
        variant="danger"
        onDismiss={() => setSubmitFailed(false)}
      />
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  scoreBadge: {flexDirection: 'row', alignItems: 'center', gap: 3},
  scoreValue: {fontFamily: theme.fonts.black, fontSize: 17, color: '#1A1C1E'},
  scoreMax: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  sectionsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  sectionsTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 16,
    color: theme.colors.text,
  },
  sectionsCount: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  sectionsList: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  bold: {fontFamily: theme.fonts.black},
});

export default RvpSiteVisitForm;

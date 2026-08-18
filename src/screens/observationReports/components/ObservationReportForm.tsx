import React from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../../../components/ScreenBackground';
import {
  AccordionSection,
  ConfirmDialog,
  DateTimeField,
  DropdownField,
  FieldLabel,
  formChrome,
  IconToggleCards,
  IconToggleOption,
  TextField,
  Toast,
  UploadField,
} from '../../../components/ui';
import {ChevronLeftIcon, StarIcon, UserPlusIcon, UsersIcon} from '../../../components/icons';
import {useFormDiscardState} from '../../../hooks/useFormDiscardState';
import {
  ObservationReport,
  ObservationReportFormOptions,
  ObservationReportFormValues,
  ObservationReportType,
} from '../../../types/observationReport';
import QuestionBlock from './QuestionBlock';
import {theme} from '../../../theme';

/** The one question whose note reveals on a Yes rather than a No. */
const TRAINING_QUESTION_INDEX = 4;

const TYPE_OPTIONS: IconToggleOption<ObservationReportType>[] = [
  {value: 'Ambassador', label: 'Ambassador', Icon: UserPlusIcon},
  {value: 'Supervisor', label: 'Supervisor', Icon: UsersIcon},
];

export function buildInitialValues(): ObservationReportFormValues {
  return {
    type: 'Ambassador',
    person: '',
    zone: '',
    dateTime: new Date().toISOString(),
    answers: {},
    notes: {},
    summary: '',
    images: [],
  };
}

/**
 * Maps a stored report back onto question keys so it can be edited.
 *
 * The record denormalizes each checklist entry by its question text; this
 * matches against the server's own question tree by prompt rather than by
 * array position, so a reordered tree still lines answers up correctly.
 *
 * An 'N/A' answer (only ever seeded, never produced by this form) collapses
 * to 'No' — the form itself has no third option, same as the source design's
 * own edit overlay, which folds anything but a literal 'Yes' onto 'No'.
 */
export function buildEditValues(
  options: ObservationReportFormOptions,
  detail: ObservationReport,
): ObservationReportFormValues {
  const byPrompt = new Map(detail.checklist.map(item => [item.question, item]));
  const answers: Record<string, 'Yes' | 'No'> = {};
  const notes: Record<string, string> = {};

  options.questions.forEach(question => {
    const stored = byPrompt.get(question.prompt);
    if (!stored) {
      return;
    }
    answers[question.key] = stored.answer === 'Yes' ? 'Yes' : 'No';
    notes[question.key] = stored.note;
  });

  return {
    type: detail.type,
    person: detail.name,
    zone: detail.zone,
    dateTime: detail.dateTime,
    answers,
    notes,
    summary: detail.summary,
    images: detail.images,
  };
}

interface Props {
  mode: 'create' | 'edit';
  reference: string;
  options: ObservationReportFormOptions;
  initialValues: ObservationReportFormValues;
  isSubmitting: boolean;
  onSubmit: (values: ObservationReportFormValues) => Promise<void>;
  onClose: () => void;
}

const ObservationReportForm: React.FC<Props> = ({
  mode,
  reference,
  options,
  initialValues,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [values, setValues] = React.useState(initialValues);
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

  const set = <K extends keyof ObservationReportFormValues>(
    key: K,
    value: ObservationReportFormValues[K],
  ) => {
    setTouched(true);
    setValues(current => ({...current, [key]: value}));
  };

  const setAnswer = (key: string, answer: 'Yes' | 'No') => {
    setTouched(true);
    setValues(current => ({
      ...current,
      answers: {...current.answers, [key]: answer},
    }));
  };

  const setNote = (key: string, note: string) => {
    setTouched(true);
    setValues(current => ({...current, notes: {...current.notes, [key]: note}}));
  };

  const personOptions =
    values.type === 'Supervisor' ? options.supervisors : options.ambassadors;

  const score = Object.values(values.answers).filter(a => a === 'Yes').length;
  const totalQuestions = options.questions.length;

  const answeredCount = Object.keys(values.answers).length;
  const canSubmit =
    values.type.length > 0 &&
    values.person.length > 0 &&
    values.zone.length > 0 &&
    values.dateTime.length > 0 &&
    answeredCount === totalQuestions &&
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
              {mode === 'edit' ? 'Edit Observation' : 'Add New Observation'}
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

          <DateTimeField
            label="Date & Time Captured"
            required
            value={values.dateTime}
            onChange={next => set('dateTime', next)}
          />

          {mode === 'edit' ? (
            <View style={formChrome.field}>
              <FieldLabel label="Type" required />
              <Text style={styles.lockedType}>{values.type}</Text>
            </View>
          ) : (
            <View style={formChrome.field}>
              <FieldLabel label="Type" required />
              <IconToggleCards
                options={TYPE_OPTIONS}
                value={values.type}
                onChange={next => {
                  setTouched(true);
                  setValues(current => ({
                    ...current,
                    type: next,
                    // The two types pick from different rosters.
                    person: '',
                  }));
                }}
              />
            </View>
          )}

          <DropdownField
            label={values.type === 'Supervisor' ? 'Supervisor' : 'Ambassador'}
            required
            placeholder={`Select ${values.type === 'Supervisor' ? 'Supervisor' : 'Ambassador'}`}
            options={personOptions}
            value={values.person || null}
            onChange={next => set('person', next)}
            searchable
            disabled={mode === 'edit'}
            helperText={
              mode === 'edit'
                ? "Locked — the person a report was written for can't be changed."
                : undefined
            }
          />

          <DropdownField
            label="Zone"
            required
            placeholder="Select zone"
            options={options.zones}
            value={values.zone || null}
            onChange={next => set('zone', next)}
            searchable
          />
        </View>

        <View style={formChrome.section}>
          <Text style={formChrome.sectionTitle}>Observation Checklist</Text>
          {options.questions.map((question, index) => (
            <View key={question.key} style={styles.question}>
              <QuestionBlock
                index={index}
                prompt={question.prompt}
                answer={values.answers[question.key] ?? ''}
                note={values.notes[question.key] ?? ''}
                onAnswer={answer => setAnswer(question.key, answer)}
                onNote={note => setNote(question.key, note)}
                revealOnYes={index === TRAINING_QUESTION_INDEX}
              />
            </View>
          ))}
        </View>

        <AccordionSection title="Other Details">
          <View style={formChrome.field}>
            <FieldLabel label="Observation Summary" />
            <TextField
              placeholder="Add notes"
              value={values.summary}
              onChangeText={next => set('summary', next)}
              multiline
              numberOfLines={3}
              style={formChrome.textarea}
            />
          </View>

          <UploadField
            label="Upload Image"
            title="Upload image"
            subtitle="PNG or JPG · up to 10 MB"
            uris={values.images}
            onChange={next => set('images', next)}
          />
        </AccordionSection>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={formChrome.footer}>
        <TouchableOpacity
          style={[formChrome.submit, !canSubmit && formChrome.submitDisabled]}
          activeOpacity={0.9}
          disabled={!canSubmit}
          onPress={() => setConfirmSubmit(true)}>
          <Text style={formChrome.submitText}>
            {mode === 'edit' ? 'Update' : 'Save'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmSubmit}
        title={mode === 'edit' ? 'Update this observation?' : 'Save this observation report?'}
        message={
          <Text>
            Observation report <Text style={styles.bold}>{reference}</Text>{' '}
            {mode === 'edit' ? (
              <>
                will be updated. <Text style={styles.bold}>{values.person}</Text> will be
                notified of the change.
              </>
            ) : (
              <>
                will be saved with a score of{' '}
                <Text style={styles.bold}>
                  {score}/{totalQuestions}
                </Text>
                .
              </>
            )}
          </Text>
        }
        confirmLabel={mode === 'edit' ? 'Update' : 'Save'}
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
        title="Discard this observation?"
        message="You have unsaved details. If you leave now, the answers and notes you entered on this form will be lost."
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
  lockedType: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.text,
  },
  question: {marginBottom: theme.spacing.xl},
  bold: {fontFamily: theme.fonts.black},
});

export default ObservationReportForm;

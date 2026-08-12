import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  useCreateWorkLogEntryMutation,
  useWorkLogFormOptionsQuery,
} from '../../graphql/features/workLog/hooks';
import {WorkLogFormValues} from '../../types/workLog';
import {GetShiftTypes} from '../../redux/auth/selectors';
import {GetActiveShiftTypeId} from '../../redux/shift/selectors';
import WorkLogForm, {buildInitialValues} from './components/WorkLogForm';
import EntryTypeStep from './components/EntryTypeStep';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {ClipboardCheckIcon} from '../../components/icons';
import {theme} from '../../theme';
import {workLogCopy} from './shiftText';

interface Props {
  onClose: () => void;
  /** Fires with the new record's id, reference, entry type and the shift it
   *  was logged under once created — the caller needs shiftTypeName to build
   *  the "{Shift} · {EntryType}" toast via workLogCopy(). */
  onCreated: (created: {
    id: string;
    reference: string;
    entryType: string;
    shiftTypeName: string;
    queued: boolean;
  }) => void;
}

const CreateWorkLogScreen: React.FC<Props> = ({onClose, onCreated}) => {
  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();
  const shiftType = shiftTypes.find(t => t.id === shiftTypeId);
  const shiftTypeName = shiftType?.name ?? 'Shift';
  const shiftTypeIcon = shiftType?.icon ?? 'general';

  const [step, setStep] = useState<'entryType' | 'form'>('entryType');
  const [entryType, setEntryType] = useState<string | null>(null);
  // Owned here rather than inside WorkLogForm: Step 2 unmounts when the user
  // taps Back to Step 1, so form state living inside it wouldn't survive a
  // Back → pick a different type → Next round trip. This component itself
  // stays mounted across that whole trip, so state here does.
  const [values, setValues] = useState<WorkLogFormValues>(() => buildInitialValues(''));

  const {
    data: options,
    isLoading,
    isError,
    refetch,
  } = useWorkLogFormOptionsQuery(shiftTypeId ?? '');
  const {mutate: create, isLoading: isSubmitting} = useCreateWorkLogEntryMutation();

  if (step === 'entryType') {
    return (
      <EntryTypeStep
        shiftTypeName={shiftTypeName}
        selected={entryType}
        onSelect={setEntryType}
        onNext={() => {
          setValues(current => ({...current, entryType: entryType ?? ''}));
          setStep('form');
        }}
        onCancel={onClose}
      />
    );
  }

  if (isError || (!isLoading && !options)) {
    return (
      <View style={styles.loading}>
        <EmptyState
          icon={<ClipboardCheckIcon size={28} color={theme.colors.primary} />}
          title="Couldn't start a new entry"
          body="Something went wrong loading the form. Check your connection and try again."
          actionLabel="Retry"
          onAction={refetch}
        />
        <TouchableOpacity style={styles.backLink} activeOpacity={0.8} onPress={onClose}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || !options) {
    // Matches WorkLogForm's own section layout: Basic Details (6 rows),
    // Location Details (5).
    return (
      <FormScreenSkeleton
        title={workLogCopy(shiftTypeName).createTitle}
        onClose={onClose}
        sectionRowCounts={[6, 5]}
      />
    );
  }

  const submit = async (submitted: WorkLogFormValues) => {
    const created = await create(submitted);
    onCreated({...created, entryType: submitted.entryType, shiftTypeName});
  };

  return (
    <View style={styles.root}>
      <WorkLogForm
        mode="create"
        shiftTypeName={shiftTypeName}
        shiftTypeIcon={shiftTypeIcon}
        reference={options.nextReference}
        options={options}
        values={values}
        onChangeValues={setValues}
        submitLabel="Submit Work"
        isSubmitting={isSubmitting}
        onSubmit={submit}
        onBack={() => setStep('entryType')}
        onClose={onClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLink: {marginTop: theme.spacing.lg, padding: theme.spacing.sm},
  backLinkText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.primary,
  },
});

export default CreateWorkLogScreen;

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  useCreateShiftNoteMutation,
  useShiftNoteFormOptionsQuery,
} from '../../graphql/features/shiftNote/hooks';
import {ShiftNoteFormValues} from '../../types/shiftNote';
import ShiftNoteForm from './components/ShiftNoteForm';
import {recipientsLabel} from './components/recipients';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {FileTextIcon} from '../../components/icons';
import {theme} from '../../theme';

const TITLE = 'Create New Shift Notes';

interface Props {
  onClose: () => void;
  onCreated: (created: {reference: string; recipients: string}) => void;
}

const ShiftNotesCreateScreen: React.FC<Props> = ({onClose, onCreated}) => {
  const {
    data: options,
    isLoading,
    isError,
    refetch,
  } = useShiftNoteFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} = useCreateShiftNoteMutation();

  // This route hides the tab bar and there is no BackHandler anywhere in the
  // app, so all three states below have to offer a way out.
  if (isError || (!isLoading && !options)) {
    return (
      <View style={styles.loading}>
        <EmptyState
          icon={<FileTextIcon size={28} color={theme.colors.primary} />}
          title="Couldn't start a new brief note"
          body="Something went wrong loading the form. Check your connection and try again."
          actionLabel="Retry"
          onAction={refetch}
        />
        <TouchableOpacity
          style={styles.backLink}
          activeOpacity={0.8}
          onPress={onClose}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || !options) {
    // Matches the form's own layout: Basic Details' five always-present rows
    // (the ambassador row is conditional), then Briefing Note's two.
    return (
      <FormScreenSkeleton
        title={TITLE}
        onClose={onClose}
        sectionRowCounts={[5, 2]}
      />
    );
  }

  const submit = async (values: ShiftNoteFormValues) => {
    const created = await create(values);
    // The toast names the recipients, and after a send the form is gone — so
    // the phrase is built from the values that were sent, by the same helper
    // the confirm dialog used.
    onCreated({
      reference: created.reference,
      recipients: recipientsLabel(values),
    });
  };

  return (
    <View style={styles.root}>
      <ShiftNoteForm
        reference={options.nextReference}
        options={options}
        isSubmitting={isSubmitting}
        onSubmit={submit}
        onClose={onClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  backLink: {marginTop: theme.spacing.lg, padding: theme.spacing.sm},
  backLinkText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.primary,
  },
});

export default ShiftNotesCreateScreen;

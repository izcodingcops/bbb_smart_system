import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  useAddPoiInteractionMutation,
  usePoiInteractionFormOptionsQuery,
  PoiCreateResult,
} from '../../graphql/features/poi/hooks';
import {PoiInteractionFormValues} from '../../types/poi';
import InteractionForm, {
  buildInteractionValues,
} from './components/InteractionForm';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {MessageSquareIcon} from '../../components/icons';
import {theme} from '../../theme';

interface Props {
  /** Pre-selected when opened from a card or a person's detail screen. */
  personId?: string;
  /** Locks the person field and titles the screen 'Add Interaction'. */
  personName?: string;
  onClose: () => void;
  /**
   * Reports the **person's** id, not the interaction's — an interaction has no
   * screen of its own, so the toast's View action opens the person.
   */
  onCreated: (created: PoiCreateResult) => void;
}

const CreateInteractionScreen: React.FC<Props> = ({
  personId,
  personName,
  onClose,
  onCreated,
}) => {
  const {
    data: options,
    isLoading,
    isError,
    refetch,
  } = usePoiInteractionFormOptionsQuery();
  const {mutate: add, isLoading: isSubmitting} = useAddPoiInteractionMutation();

  if (isError || (!isLoading && !options)) {
    return (
      <View style={styles.loading}>
        <EmptyState
          icon={<MessageSquareIcon size={28} color={theme.colors.primary} />}
          title="Couldn't start a new interaction"
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
    // Matches InteractionForm's sections: Basic (4 rows), Other Details (5).
    return (
      <FormScreenSkeleton
        title={personName ? 'Add Interaction' : 'Create Interaction'}
        onClose={onClose}
        sectionRowCounts={[4, 5]}
      />
    );
  }

  const submit = async (values: PoiInteractionFormValues) => {
    const created = await add(values.personId, values);
    onCreated({
      // The person's id, deliberately — see the prop's own comment.
      id: values.personId,
      reference: created.reference,
      queued: created.queued,
    });
  };

  return (
    <View style={styles.root}>
      <InteractionForm
        reference={options.nextReference}
        options={options}
        initialValues={buildInteractionValues(options, personId)}
        lockedPersonName={personName}
        isSubmitting={isSubmitting}
        onSubmit={submit}
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
    backgroundColor: theme.colors.background,
  },
  backLink: {marginTop: theme.spacing.lg, padding: theme.spacing.sm},
  backLinkText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.primary,
  },
});

export default CreateInteractionScreen;

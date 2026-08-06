import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  useAddPoiUpdateMutation,
  usePoiUpdateFormOptionsQuery,
  PoiCreateResult,
} from '../../graphql/features/poi/hooks';
import {PoiUpdateFormValues} from '../../types/poi';
import UpdateForm, {buildUpdateValues} from './components/UpdateForm';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {ClockIcon} from '../../components/icons';
import {theme} from '../../theme';

interface Props {
  /** Pre-selected when opened from a card or a person's detail screen. */
  personId?: string;
  /** Locks the person field. */
  personName?: string;
  onClose: () => void;
  /**
   * Reports the **person's** id, not the update's — an update has no screen of
   * its own, so the toast's View action opens the person.
   */
  onCreated: (created: PoiCreateResult) => void;
}

const CreateUpdateScreen: React.FC<Props> = ({
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
  } = usePoiUpdateFormOptionsQuery();
  const {mutate: add, isLoading: isSubmitting} = useAddPoiUpdateMutation();

  if (isError || (!isLoading && !options)) {
    return (
      <View style={styles.loading}>
        <EmptyState
          icon={<ClockIcon size={28} color={theme.colors.primary} />}
          title="Couldn't start a new update"
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
    // Matches UpdateForm's single section: 4 rows.
    return (
      <FormScreenSkeleton
        title="Add Update"
        onClose={onClose}
        sectionRowCounts={[4]}
      />
    );
  }

  const submit = async (values: PoiUpdateFormValues) => {
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
      <UpdateForm
        reference={options.nextReference}
        options={options}
        initialValues={buildUpdateValues(options, personId)}
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

export default CreateUpdateScreen;

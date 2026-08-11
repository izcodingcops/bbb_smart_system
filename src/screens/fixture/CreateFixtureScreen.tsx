import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  useCreateFixtureMutation,
  useFixtureFormOptionsQuery,
} from '../../graphql/features/fixture/hooks';
import {FixtureFormValues} from '../../types/fixture';
import FixtureForm, {buildInitialValues} from './components/FixtureForm';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {BoxIcon} from '../../components/icons';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
  /** Fires with the new record's id, reference and queued state once created. */
  onCreated: (created: {id: string; reference: string; queued: boolean}) => void;
}

const CreateFixtureScreen: React.FC<Props> = ({onClose, onCreated}) => {
  const {data: options, isLoading, isError, refetch} = useFixtureFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} = useCreateFixtureMutation();

  if (isError || (!isLoading && !options)) {
    return (
      <View style={styles.loading}>
        <EmptyState
          icon={<BoxIcon size={28} color={theme.colors.primary} />}
          title="Couldn't start a new fixture"
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
    // Matches FixtureForm's own section layout: Basic (4 rows), Location (3),
    // Other (2).
    return (
      <FormScreenSkeleton
        title="Create Fixture"
        onClose={onClose}
        sectionRowCounts={[4, 3, 2]}
      />
    );
  }

  const submit = async (values: FixtureFormValues) => {
    const created = await create(values);
    onCreated(created);
  };

  return (
    <View style={styles.root}>
      <FixtureForm
        mode="create"
        reference={options.nextReference}
        options={options}
        initialValues={buildInitialValues(options)}
        submitLabel="Submit"
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
  },
  backLink: {marginTop: theme.spacing.lg, padding: theme.spacing.sm},
  backLinkText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.primary,
  },
});

export default CreateFixtureScreen;

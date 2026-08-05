import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useCreateIncidentMutation, useIncidentFormOptionsQuery} from '../../graphql/features/incident/hooks';
import {IncidentFormValues} from '../../types/incident';
import IncidentForm, {buildInitialValues} from './components/IncidentForm';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {AlertTriangleIcon} from '../../components/icons';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
  /** Fires with the new incident's id, reference and queued state once created. */
  onCreated: (created: {id: string; reference: string; queued: boolean}) => void;
  /** Set only when opened from within a Dispatch call's Add Incident flow. */
  dispatchReference?: string;
}

const CreateIncidentScreen: React.FC<Props> = ({onClose, onCreated, dispatchReference}) => {
  const {data: options, isLoading, isError, refetch} = useIncidentFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} = useCreateIncidentMutation();

  if (isError || (!isLoading && !options)) {
    return (
      <View style={styles.loading}>
        <EmptyState
          icon={<AlertTriangleIcon size={28} color={theme.colors.primary} />}
          title="Couldn't start a new incident"
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
    // Matches IncidentForm's own layout: Basic (4 rows), Location (3),
    // Other (6), then one row each for the four involvement blocks, Parties
    // and Vehicles, and 4 for Connected Elements.
    return (
      <FormScreenSkeleton
        title="Create Incident"
        onClose={onClose}
        sectionRowCounts={[4, 3, 6, 1, 1, 1, 1, 1, 1, 4]}
      />
    );
  }

  const submit = async (values: IncidentFormValues) => {
    const created = await create(values, dispatchReference ? {dispatchReference} : undefined);
    onCreated(created);
  };

  return (
    <View style={styles.root}>
      <IncidentForm
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
    backgroundColor: theme.colors.background,
  },
  backLink: {marginTop: theme.spacing.lg, padding: theme.spacing.sm},
  backLinkText: {fontFamily: theme.fonts.black, fontSize: 14, color: theme.colors.primary},
});

export default CreateIncidentScreen;

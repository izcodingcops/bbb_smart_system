import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  useCreateEquipmentMutation,
  useEquipmentFormOptionsQuery,
} from '../../graphql/features/equipment/hooks';
import {EquipmentFormValues} from '../../types/equipment';
import EquipmentForm, {buildInitialValues} from './components/EquipmentForm';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {BoxIcon} from '../../components/icons';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
  /** Fires with the new record's id, reference and queued state once created. */
  onCreated: (created: {id: string; reference: string; queued: boolean}) => void;
}

const CreateEquipmentScreen: React.FC<Props> = ({onClose, onCreated}) => {
  const {
    data: options,
    isLoading,
    isError,
    refetch,
  } = useEquipmentFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} = useCreateEquipmentMutation();

  // The "Go back" link is part of this branch on purpose — this route hides the
  // tab bar, so a failed load with no way out would trap the user, and there is
  // no BackHandler anywhere in this app. EquipmentFormError isn't reused here:
  // its copy is about loading an existing record, which this screen has none of.
  if (isError || (!isLoading && !options)) {
    return (
      <View style={styles.loading}>
        <EmptyState
          icon={<BoxIcon size={28} color={theme.colors.primary} />}
          title="Couldn't start new equipment"
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
    // Matches EquipmentForm's own section layout: Basic (9 rows), Other (6),
    // Connected (3).
    return (
      <FormScreenSkeleton
        title="Add Equipment"
        onClose={onClose}
        sectionRowCounts={[9, 6, 3]}
      />
    );
  }

  const submit = async (values: EquipmentFormValues) => {
    const created = await create(values);
    onCreated(created);
  };

  return (
    <View style={styles.root}>
      <EquipmentForm
        mode="create"
        reference={options.nextReference}
        options={options}
        initialValues={buildInitialValues(options)}
        submitLabel="Add Equipment"
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

export default CreateEquipmentScreen;

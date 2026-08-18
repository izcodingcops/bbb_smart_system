import React, {useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  useCreateEquipmentMutation,
  useEquipmentFormOptionsQuery,
} from '../../graphql/features/equipment/hooks';
import {EquipmentFormValues} from '../../types/equipment';
import EquipmentForm, {buildInitialValues, EquipmentFormHandle} from './components/EquipmentForm';
import ConnectedElementCreateOverlay, {
  useConnectedElementCreate,
} from './components/ConnectedElementCreateOverlay';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {BoxIcon} from '../../components/icons';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
  /**
   * Fires with the new record's id, reference, name and queued state once
   * created. `name` is what Maintenance selects when it opens this form to
   * fill its Equipment field.
   */
  onCreated: (created: {
    id: string;
    reference: string;
    name: string;
    queued: boolean;
  }) => void;
  /**
   * False when this screen is itself opened as a Connected Elements
   * quick-create from another module (Incident's, POI's or Maintenance's own
   * Connected Elements). Its own Connected Elements then offers no further
   * Add buttons, so quick-create never nests more than one level deep.
   */
  allowConnectedCreate?: boolean;
}

const CreateEquipmentScreen: React.FC<Props> = ({
  onClose,
  onCreated,
  allowConnectedCreate = true,
}) => {
  const {
    data: options,
    isLoading,
    isError,
    refetch,
  } = useEquipmentFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} = useCreateEquipmentMutation();
  // Lets each create form select what it just made, without remounting the
  // equipment form and discarding everything else the user has typed.
  const formRef = useRef<EquipmentFormHandle>(null);
  const connectedCreate = useConnectedElementCreate(formRef, refetch);

  // The "Go back" link is part of this branch on purpose — this route hides the
  // tab bar, so a failed load with no way out would trap the user, and there is
  // no BackHandler anywhere in this app. EquipmentFormError isn't reused here:
  // its copy is about loading an existing record, which this screen has none of.
  //
  // Only a load that left us with nothing is fatal. Once the options are in
  // hand the form is mounted and holding the user's input, so a later refetch
  // that fails must not replace it with a full-screen error.
  if (!options && (isError || !isLoading)) {
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

  // Gated on the data alone, never on `isLoading` — see CreateIncidentScreen's
  // identical comment. `refetch` keeps the previous data, so `options` stays
  // populated throughout Connected Elements' quick-create refetches.
  if (!options) {
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
        ref={formRef}
        mode="create"
        reference={options.nextReference}
        options={options}
        initialValues={buildInitialValues(options)}
        submitLabel="Add Equipment"
        isSubmitting={isSubmitting}
        onSubmit={submit}
        onClose={onClose}
        {...(allowConnectedCreate ? connectedCreate.formProps : null)}
      />

      {allowConnectedCreate ? (
        <ConnectedElementCreateOverlay {...connectedCreate.overlayProps} />
      ) : null}
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

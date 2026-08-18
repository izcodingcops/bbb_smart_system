import React, {useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useCreateIncidentMutation, useIncidentFormOptionsQuery} from '../../graphql/features/incident/hooks';
import {IncidentFormValues} from '../../types/incident';
import IncidentForm, {buildInitialValues, IncidentFormHandle} from './components/IncidentForm';
import ConnectedElementCreateOverlay, {
  useConnectedElementCreate,
} from './components/ConnectedElementCreateOverlay';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {AlertTriangleIcon} from '../../components/icons';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
  /**
   * Fires with the new incident's id, reference, queued state and the type and
   * time it was filed under. Maintenance builds its Connected Elements option
   * label from the latter two when it opens this form to fill that field.
   */
  onCreated: (created: {
    id: string;
    reference: string;
    incidentType: string;
    occurredAt: string;
    queued: boolean;
  }) => void;
  /** Set only when opened from within a Dispatch call's Add Incident flow. */
  dispatchReference?: string;
  /**
   * Seeds the Address field. Maintenance passes the address already on its own
   * form, since an incident raised against a request happened where it did.
   */
  defaultAddress?: string;
  /**
   * False when this screen is itself opened as a Connected Elements
   * quick-create from another module (Maintenance's or POI's own Connected
   * Elements). Its own Connected Elements then offers no further Add
   * buttons, so quick-create never nests more than one level deep.
   */
  allowConnectedCreate?: boolean;
}

const CreateIncidentScreen: React.FC<Props> = ({
  onClose,
  onCreated,
  dispatchReference,
  defaultAddress,
  allowConnectedCreate = true,
}) => {
  const {data: options, isLoading, isError, refetch} = useIncidentFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} = useCreateIncidentMutation();
  // Lets each create form select what it just made, without remounting the
  // incident form and discarding everything else the user has typed.
  const formRef = useRef<IncidentFormHandle>(null);
  const connectedCreate = useConnectedElementCreate(formRef, refetch);

  // Only a load that left us with nothing is fatal. Once the options are in
  // hand the form is mounted and holding the user's input, so a later refetch
  // that fails must not replace it with a full-screen error.
  if (!options && (isError || !isLoading)) {
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

  // Gated on the data alone, never on `isLoading`. Apollo reports loading again
  // for a refetch, and Connected Elements' quick-create refetches these
  // options — so keying off the flag would swap the mounted form for this
  // skeleton, unmount it, and throw away both the item just selected and
  // everything typed so far. `refetch` keeps the previous data, so `options`
  // stays populated throughout.
  if (!options) {
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
        ref={formRef}
        mode="create"
        reference={options.nextReference}
        options={options}
        initialValues={
          defaultAddress
            ? {...buildInitialValues(options), address: defaultAddress}
            : buildInitialValues(options)
        }
        submitLabel="Submit"
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
  backLinkText: {fontFamily: theme.fonts.black, fontSize: 14, color: theme.colors.primary},
});

export default CreateIncidentScreen;

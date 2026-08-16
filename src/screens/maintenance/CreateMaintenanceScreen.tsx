import React, {useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  useCreateMaintenanceRequestMutation,
  useMaintenanceFormOptionsQuery,
} from '../../graphql/features/maintenance/hooks';
import {MaintenanceFormValues} from '../../types/maintenance';
import {GetUserRole} from '../../redux/auth/selectors';
import MaintenanceForm, {
  buildInitialValues,
  MaintenanceFormHandle,
} from './components/MaintenanceForm';
import ConnectedElementCreateOverlay, {
  useConnectedElementCreate,
} from './components/ConnectedElementCreateOverlay';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {ToolsIcon} from '../../components/icons';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
  /** Fires with the new record's id, reference and queued state once created. */
  onCreated: (created: {id: string; reference: string; queued: boolean}) => void;
}

const CreateMaintenanceScreen: React.FC<Props> = ({onClose, onCreated}) => {
  const {data: options, isLoading, isError, refetch} = useMaintenanceFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} =
    useCreateMaintenanceRequestMutation();
  // Lets each create form select what it just made, without remounting the
  // maintenance form and discarding everything else the user has typed.
  const formRef = useRef<MaintenanceFormHandle>(null);
  const connectedCreate = useConnectedElementCreate(formRef, refetch);
  // Decides which assignee options the fresh form starts on — a supervisor's
  // list has no 'Supervisor' entry, so the default has to differ by role.
  const role = GetUserRole() ?? 'ambassador';

  // Only a load that left us with nothing is fatal. Once the options are in
  // hand the form is mounted and holding the user's input, so a later refetch
  // that fails must not replace it with a full-screen error.
  if (!options && (isError || !isLoading)) {
    return (
      <View style={styles.loading}>
        <EmptyState
          icon={<ToolsIcon size={28} color={theme.colors.primary} />}
          title="Couldn't start a new request"
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
  // for a refetch, and every quick-create sheet refetches these options — so
  // keying off the flag would swap the mounted form for this skeleton, unmount
  // it, and throw away both the item just selected and everything typed so far.
  // `refetch` keeps the previous data, so `options` stays populated throughout.
  if (!options) {
    // Matches MaintenanceForm's own section layout: Basic (4 rows), Other (2),
    // Location (4), Connected Elements (4).
    return (
      <FormScreenSkeleton
        title="Create Maintenance"
        onClose={onClose}
        sectionRowCounts={[4, 2, 4, 4]}
      />
    );
  }

  const submit = async (values: MaintenanceFormValues) => {
    const created = await create(values);
    onCreated(created);
  };

  return (
    <View style={styles.root}>
      <MaintenanceForm
        ref={formRef}
        mode="create"
        reference={options.nextReference}
        options={options}
        initialValues={buildInitialValues(options, undefined, role)}
        submitLabel="Submit"
        isSubmitting={isSubmitting}
        onSubmit={submit}
        onClose={onClose}
        {...connectedCreate.formProps}
      />

      <ConnectedElementCreateOverlay {...connectedCreate.overlayProps} />
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

export default CreateMaintenanceScreen;

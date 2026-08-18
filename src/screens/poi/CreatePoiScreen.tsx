import React, {useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  useCreatePoiMutation,
  usePoiFormOptionsQuery,
  PersonCreateResult,
} from '../../graphql/features/poi/hooks';
import {PoiFormValues} from '../../types/poi';
import PoiForm, {buildInitialValues, PoiFormHandle} from './components/PoiForm';
import ConnectedElementCreateOverlay, {
  useConnectedElementCreate,
} from './components/ConnectedElementCreateOverlay';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {UserPlusIcon} from '../../components/icons';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
  onCreated: (created: PersonCreateResult) => void;
  /**
   * False when this screen is itself opened as a Connected Elements
   * quick-create from another module (Incident's or Maintenance's own
   * Connected Elements). Its own Connected Elements then offers no further
   * Add buttons, so quick-create never nests more than one level deep.
   */
  allowConnectedCreate?: boolean;
}

const CreatePoiScreen: React.FC<Props> = ({
  onClose,
  onCreated,
  allowConnectedCreate = true,
}) => {
  const {data: options, isLoading, isError, refetch} = usePoiFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} = useCreatePoiMutation();
  // Lets each create form select what it just made, without remounting the
  // POI form and discarding everything else the user has typed.
  const formRef = useRef<PoiFormHandle>(null);
  const connectedCreate = useConnectedElementCreate(formRef, refetch);

  // Only a load that left us with nothing is fatal. Once the options are in
  // hand the form is mounted and holding the user's input, so a later refetch
  // that fails must not replace it with a full-screen error.
  if (!options && (isError || !isLoading)) {
    return (
      <View style={styles.loading}>
        <EmptyState
          icon={<UserPlusIcon size={28} color={theme.colors.primary} />}
          title="Couldn't start a new person"
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
    // Matches PoiForm's own section layout: Basic (5 rows), Demographics (8),
    // Contacts (5), Connected (3).
    return (
      <FormScreenSkeleton
        title="Create Person"
        onClose={onClose}
        sectionRowCounts={[5, 8, 5, 3]}
      />
    );
  }

  const submit = async (values: PoiFormValues) => {
    const created = await create(values);
    onCreated(created);
  };

  return (
    <View style={styles.root}>
      <PoiForm
        ref={formRef}
        mode="create"
        reference={options.nextReference}
        options={options}
        initialValues={buildInitialValues(options)}
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
  backLinkText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.primary,
  },
});

export default CreatePoiScreen;

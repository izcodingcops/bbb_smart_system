import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator, StyleSheet} from 'react-native';
import {
  useCreateMaintenanceRequestMutation,
  useMaintenanceFormOptionsQuery,
} from '../../graphql/features/maintenance/hooks';
import {MaintenanceFormValues} from '../../types/maintenance';
import MaintenanceForm, {buildInitialValues} from './components/MaintenanceForm';
import AddFixtureSheet from './components/AddFixtureSheet';
import {EmptyState} from '../../components/ui';
import {ToolsIcon} from '../../components/icons';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
  /** Fires with the new record's id and reference once it's been created. */
  onCreated: (created: {id: string; reference: string}) => void;
}

const CreateMaintenanceScreen: React.FC<Props> = ({onClose, onCreated}) => {
  const {data: options, isLoading, isError, refetch} = useMaintenanceFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} =
    useCreateMaintenanceRequestMutation();
  const [addFixtureOpen, setAddFixtureOpen] = useState(false);

  if (isError || (!isLoading && !options)) {
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

  if (isLoading || !options) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <TouchableOpacity style={styles.backLink} activeOpacity={0.8} onPress={onClose}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const submit = async (values: MaintenanceFormValues) => {
    const created = await create(values);
    onCreated(created);
  };

  return (
    <View style={styles.root}>
      <MaintenanceForm
        // Remounts when the fixture list changes so a quick-created fixture
        // shows up in the dropdown's options.
        key={options.fixtures.length}
        mode="create"
        reference={options.nextReference}
        options={options}
        initialValues={buildInitialValues(options)}
        submitLabel="Submit"
        isSubmitting={isSubmitting}
        onSubmit={submit}
        onClose={onClose}
        onAddFixture={() => setAddFixtureOpen(true)}
      />

      <AddFixtureSheet
        visible={addFixtureOpen}
        options={options}
        onCreated={() => refetch()}
        onClose={() => setAddFixtureOpen(false)}
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

export default CreateMaintenanceScreen;

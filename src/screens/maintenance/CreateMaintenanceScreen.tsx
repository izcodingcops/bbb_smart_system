import React, {useState} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {
  useCreateMaintenanceRequestMutation,
  useMaintenanceFormOptionsQuery,
} from '../../graphql/features/maintenance/hooks';
import {MaintenanceFormValues} from '../../types/maintenance';
import MaintenanceForm, {buildInitialValues} from './components/MaintenanceForm';
import AddFixtureSheet from './components/AddFixtureSheet';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
  /** Fires with the new record's reference once it's been created. */
  onCreated: (reference: string) => void;
}

const CreateMaintenanceScreen: React.FC<Props> = ({onClose, onCreated}) => {
  const {data: options, isLoading, refetch} = useMaintenanceFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} =
    useCreateMaintenanceRequestMutation();
  const [addFixtureOpen, setAddFixtureOpen] = useState(false);

  if (isLoading || !options) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const submit = async (values: MaintenanceFormValues) => {
    const reference = await create(values);
    onCreated(reference);
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
});

export default CreateMaintenanceScreen;

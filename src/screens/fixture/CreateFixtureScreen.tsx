import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {
  useCreateFixtureMutation,
  useFixtureFormOptionsQuery,
} from '../../graphql/features/fixture/hooks';
import {FixtureFormValues} from '../../types/fixture';
import FixtureForm, {buildInitialValues} from './components/FixtureForm';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
  /** Fires with the new record's reference once it's been created. */
  onCreated: (reference: string) => void;
}

const CreateFixtureScreen: React.FC<Props> = ({onClose, onCreated}) => {
  const {data: options, isLoading} = useFixtureFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} = useCreateFixtureMutation();

  if (isLoading || !options) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const submit = async (values: FixtureFormValues) => {
    const reference = await create(values);
    onCreated(reference);
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
    backgroundColor: theme.colors.background,
  },
});

export default CreateFixtureScreen;

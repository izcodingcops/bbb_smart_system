import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  useCreatePoiMutation,
  usePoiFormOptionsQuery,
  PoiCreateResult,
} from '../../graphql/features/poi/hooks';
import {PoiFormValues} from '../../types/poi';
import PoiForm, {buildInitialValues} from './components/PoiForm';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {UserPlusIcon} from '../../components/icons';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
  onCreated: (created: PoiCreateResult) => void;
}

const CreatePoiScreen: React.FC<Props> = ({onClose, onCreated}) => {
  const {data: options, isLoading, isError, refetch} = usePoiFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} = useCreatePoiMutation();

  if (isError || (!isLoading && !options)) {
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

  if (isLoading || !options) {
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

export default CreatePoiScreen;

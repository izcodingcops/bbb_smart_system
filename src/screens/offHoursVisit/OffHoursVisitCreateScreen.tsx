import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  useCreateOffHoursVisitMutation,
  useOffHoursVisitFormOptionsQuery,
} from '../../graphql/features/offHoursVisit/hooks';
import {OffHoursVisitFormValues} from '../../types/offHoursVisit';
import OffHoursVisitForm from './components/OffHoursVisitForm';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {ClockIcon} from '../../components/icons';
import {theme} from '../../theme';

const TITLE = 'Add New Off Hours';

interface Props {
  onClose: () => void;
  onCreated: (created: {reference: string}) => void;
}

const OffHoursVisitCreateScreen: React.FC<Props> = ({onClose, onCreated}) => {
  const {data: options, isLoading, isError, refetch} =
    useOffHoursVisitFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} =
    useCreateOffHoursVisitMutation();

  // This route hides the tab bar and there is no BackHandler anywhere in the
  // app, so all three states below have to offer a way out.
  if (isError || (!isLoading && !options)) {
    return (
      <View style={styles.loading}>
        <EmptyState
          icon={<ClockIcon size={28} color={theme.colors.primary} />}
          title="Couldn't start a new off hours visit"
          body="Something went wrong loading the form. Check your connection and try again."
          actionLabel="Retry"
          onAction={refetch}
        />
        <TouchableOpacity
          style={styles.backLink}
          activeOpacity={0.8}
          onPress={onClose}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || !options) {
    // Matches the form's own layout: Basic (3 rows), the five checklist
    // questions, then the collapsed Other Details header.
    return (
      <FormScreenSkeleton
        title={TITLE}
        onClose={onClose}
        sectionRowCounts={[3, 5, 1]}
      />
    );
  }

  const submit = async (values: OffHoursVisitFormValues) => {
    const created = await create(values, options.questions);
    onCreated({reference: created.reference});
  };

  return (
    <View style={styles.root}>
      <OffHoursVisitForm
        reference={options.nextReference}
        options={options}
        isSubmitting={isSubmitting}
        onSubmit={submit}
        onClose={onClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  backLink: {marginTop: theme.spacing.lg, padding: theme.spacing.sm},
  backLinkText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.primary,
  },
});

export default OffHoursVisitCreateScreen;

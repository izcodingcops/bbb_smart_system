import React from 'react';
import {View, StyleSheet} from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {ClipboardCheckIcon} from '../../components/icons';
import {
  useCreateObservationReportMutation,
  useObservationReportFormOptionsQuery,
} from '../../graphql/features/observationReport/hooks';
import ObservationReportForm, {buildInitialValues} from './components/ObservationReportForm';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
  onCreated: (created: {id: string; reference: string; score: number}) => void;
}

const CreateObservationReportScreen: React.FC<Props> = ({onClose, onCreated}) => {
  // Both hooks run before every early return below.
  const {data: options, isLoading, isError} = useObservationReportFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} = useCreateObservationReportMutation();

  // This route hides the tab bar and the app has no BackHandler, so every state
  // — including this one — has to offer a way out.
  if (isError || (!isLoading && !options)) {
    return (
      <ScreenBackground style={styles.root}>
        <View style={styles.centre}>
          <EmptyState
            icon={<ClipboardCheckIcon size={28} color={theme.colors.primary} />}
            title="Couldn't open the form"
            body="Something went wrong loading this form. Check your connection and try again."
            actionLabel="Go back"
            onAction={onClose}
          />
        </View>
      </ScreenBackground>
    );
  }

  if (isLoading || !options) {
    // Basic Details' four rows, then the five-question checklist.
    return (
      <FormScreenSkeleton
        title="Add New Observation"
        onClose={onClose}
        sectionRowCounts={[4, 5]}
      />
    );
  }

  return (
    <ObservationReportForm
      mode="create"
      reference={options.nextReference}
      options={options}
      initialValues={buildInitialValues()}
      isSubmitting={isSubmitting}
      onSubmit={async values => {
        const created = await create(values);
        onCreated(created);
      }}
      onClose={onClose}
    />
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  centre: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});

export default CreateObservationReportScreen;

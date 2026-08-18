import React from 'react';
import {View, StyleSheet} from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import {EmptyState, FormScreenSkeleton} from '../../components/ui';
import {MapPinIcon} from '../../components/icons';
import {
  useCreateRvpSiteVisitMutation,
  useRvpSiteVisitFormOptionsQuery,
} from '../../graphql/features/rvpSiteVisit/hooks';
import RvpSiteVisitForm, {buildInitialValues} from './components/RvpSiteVisitForm';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
  onCreated: (created: {id: string; reference: string; score: number}) => void;
}

const CreateRvpSiteVisitScreen: React.FC<Props> = ({onClose, onCreated}) => {
  // Both hooks run before every early return below.
  const {data: options, isLoading, isError} = useRvpSiteVisitFormOptionsQuery();
  const {mutate: create, isLoading: isSubmitting} =
    useCreateRvpSiteVisitMutation();

  // This route hides the tab bar and the app has no BackHandler, so every state
  // — including this one — has to offer a way out.
  if (isError || (!isLoading && !options)) {
    return (
      <ScreenBackground style={styles.root}>
        <View style={styles.centre}>
          <EmptyState
            icon={<MapPinIcon size={28} color={theme.colors.primary} />}
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
    // Basic Details' six rows, then the ten section cards.
    return (
      <FormScreenSkeleton
        title="Create RVP Site Visit"
        onClose={onClose}
        sectionRowCounts={[6, 10]}
      />
    );
  }

  return (
    <RvpSiteVisitForm
      mode="create"
      reference={options.nextReference}
      options={options}
      initialValues={buildInitialValues(options)}
      isSubmitting={isSubmitting}
      onSubmit={async values => {
        const created = await create(values, options.sections);
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

export default CreateRvpSiteVisitScreen;

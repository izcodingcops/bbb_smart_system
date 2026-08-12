import React from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import {
  DetailField,
  DetailScreenSkeleton,
  DetailSection,
  DetailTopBar,
  EmptyState,
  formatDateTime,
  StatusPill,
} from '../../components/ui';
import {FileTextIcon} from '../../components/icons';
import {useGetReferenceDocumentQuery} from '../../graphql/features/referenceDocument/hooks';
import {theme} from '../../theme';

interface Props {
  id: string;
  onClose: () => void;
}

const ViewReferenceDocumentScreen: React.FC<Props> = ({id, onClose}) => {
  // Only hook in this component — runs before every early return below.
  const {data: detail, isLoading, isError, refetch} = useGetReferenceDocumentQuery(id);

  if (isLoading) {
    return (
      <DetailScreenSkeleton
        title="Cleaning"
        onBack={onClose}
        sections={[
          ['half', 'half', 'full', 'half', 'half'],
          ['full', 'half', 'half', 'half', 'half', 'half', 'half', 'full'],
        ]}
      />
    );
  }

  // The back button renders above this branch on purpose — the tab bar is
  // hidden on this route, so a failed load with no way out would trap the user.
  if (isError || !detail) {
    return (
      <ScreenBackground style={styles.root}>
        <DetailTopBar title="Cleaning" onBack={onClose} />
        <View style={styles.loading}>
          <EmptyState
            icon={<FileTextIcon size={28} color={theme.colors.primary} />}
            title="Couldn't load this document"
            body="Something went wrong fetching it. Check your connection and try again."
            actionLabel="Retry"
            onAction={refetch}
          />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={styles.root}>
      <DetailTopBar title="Cleaning" reference={detail.reference} onBack={onClose} />

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.idRow}>
          <StatusPill label="Completed" bg="#DCFCE7" fg="#16A34A" size="md" />
        </View>

        <DetailSection title="Basic Details">
          <DetailField label="Type of Request" value="Cleaning" />
          <DetailField label="Sub-Type" value={detail.entryType} />
          <DetailField label="Created At" value={formatDateTime(detail.dateTime)} full />
          <DetailField label="Created By" value={detail.createdBy} />
          <DetailField label="Assigned To" value={detail.assignedTo} />
        </DetailSection>

        <DetailSection title="Location Details">
          <DetailField label="Describe the Location" value={detail.describe} full />
          <DetailField label="Business Name" value={detail.business} />
          <DetailField label="Zone" value={detail.zone} />
          <DetailField label="Fixture Type" value={detail.fixtureType} />
          <DetailField label="Fixture" value={detail.fixture} />
          <DetailField label="Type of Service" value={detail.service} />
          <DetailField label="Quantity" value={detail.quantity} />
          <DetailField label="User Location" value={detail.address} full />
        </DetailSection>
      </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {paddingBottom: 40},
  idRow: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 18,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
});

export default ViewReferenceDocumentScreen;

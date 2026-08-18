import React from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ScreenBackground from '../../components/ScreenBackground';
import {
  DetailField,
  DetailScreenSkeleton,
  DetailSection,
  DetailTopBar,
  EmptyState,
  StatusPill,
  formatCardDate,
} from '../../components/ui';
import {WorkIcon} from '../../components/icons';
import {
  useGetAmbassadorQuery,
  useGetAmbassadorWorkItemQuery,
} from '../../graphql/features/ambassador/hooks';
import {AmbassadorsStackParamList} from './routes';
import {theme} from '../../theme';

type Navigation = NativeStackNavigationProp<AmbassadorsStackParamList, 'AmbassadorsWorkView'>;
type Route = RouteProp<AmbassadorsStackParamList, 'AmbassadorsWorkView'>;

const STATUS_STYLE: Record<string, {bg: string; fg: string}> = {
  Completed: {bg: '#F6FFED', fg: '#389E0D'},
  'In Progress': {bg: '#FFFBE6', fg: '#AD8B00'},
  Open: {bg: '#EEF0F2', fg: '#5B5F66'},
};

/**
 * Reference Documents' own Basic + Location pattern, verbatim — no edit, no
 * "time aged" banner, same as that module's read-only detail. Reuses
 * `DetailSection`/`DetailField` directly rather than a new component.
 */
const AmbassadorWorkViewScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const {id} = route.params;

  const {data: work, isLoading, isError, refetch} = useGetAmbassadorWorkItemQuery(id);
  const {data: ambassador} = useGetAmbassadorQuery(work?.ambassadorId ?? '');

  if (isLoading) {
    return (
      <DetailScreenSkeleton
        title="Work"
        onBack={() => navigation.goBack()}
        sections={[
          ['half', 'half', 'full', 'half', 'half', 'half', 'half', 'half'],
          ['full', 'half', 'half', 'half'],
        ]}
      />
    );
  }

  if (isError || !work) {
    return (
      <ScreenBackground style={styles.root}>
        <DetailTopBar title="Work" onBack={() => navigation.goBack()} />
        <View style={styles.loading}>
          <EmptyState
            icon={<WorkIcon size={28} color={theme.colors.primary} />}
            title="Couldn't load this record"
            body="Something went wrong fetching it. Check your connection and try again."
            actionLabel="Retry"
            onAction={refetch}
          />
        </View>
      </ScreenBackground>
    );
  }

  const statusStyle = STATUS_STYLE[work.status];

  return (
    <ScreenBackground style={styles.root}>
      <DetailTopBar
        title={work.type}
        reference={`${work.reference} - ${work.subType}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.idRow}>
          <StatusPill label={work.status} bg={statusStyle.bg} fg={statusStyle.fg} size="md" />
        </View>

        <DetailSection title="Basic Details">
          <DetailField label="Type of Request" value={work.type} />
          <DetailField label="Sub-Type of Request" value={work.subType} />
          <DetailField label="Created At" value={formatCardDate(work.date)} />
          <DetailField label="Assigned To" value={ambassador?.name} />
          <DetailField label="Work Status" value={work.status} />
          <DetailField label="Fixture Type" value={work.fixtureType} />
          <DetailField label="Fixture" value={work.fixture} />
          <DetailField label="Type of Service" value={work.service} />
        </DetailSection>

        <DetailSection title="Location Details">
          <DetailField label="Location" value={work.address} full />
          <DetailField label="Zone" value={work.zone} />
          <DetailField label="Describe Location" value={work.describeLocation} />
          <DetailField label="Quantity" value={work.quantity} />
        </DetailSection>
      </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  body: {paddingBottom: 40},
  idRow: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 18,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
});

export default AmbassadorWorkViewScreen;

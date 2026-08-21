import React from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ScreenBackground from '../../components/ScreenBackground';
import {
  DetailField,
  DetailScreenSkeleton,
  DetailSection,
  DetailTopBar,
  EmptyState,
  PersonChip,
  ScorePill,
  StatusPill,
  formatCardDate,
} from '../../components/ui';
import {ChevronRightIcon, StarIcon, UsersIcon} from '../../components/icons';
import {
  useGetAmbassadorQuery,
  useGetAmbassadorReportsQuery,
  useGetAmbassadorWorkQuery,
} from '../../graphql/features/ambassador/hooks';
import AmbassadorWorkCard from './components/AmbassadorWorkCard';
import ReportCard from '../observationReports/components/ReportCard';
import {AmbassadorsStackParamList} from './routes';
import {theme} from '../../theme';

type Navigation = NativeStackNavigationProp<AmbassadorsStackParamList, 'AmbassadorsProfile'>;
type Route = RouteProp<AmbassadorsStackParamList, 'AmbassadorsProfile'>;

const STATUS_STYLE: Record<string, {bg: string; fg: string}> = {
  Active: {bg: '#F1F9EC', fg: '#5C9B36'},
  'In-active': {bg: '#EEF0F2', fg: '#5B5F66'},
  Suspended: {bg: '#FFF2F0', fg: '#CF1322'},
};

function formatPoints(points: number): string {
  return `${points.toLocaleString('en-US')} pts`;
}

const ViewAllLink: React.FC<{label: string; onPress: () => void}> = ({label, onPress}) => (
  <TouchableOpacity style={styles.viewAll} activeOpacity={0.7} onPress={onPress}>
    <Text style={styles.viewAllText}>{label}</Text>
    <ChevronRightIcon size={15} color={theme.colors.primary} />
  </TouchableOpacity>
);

const AmbassadorProfileScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const {id} = route.params;

  const {data: ambassador, isLoading, isError, refetch} = useGetAmbassadorQuery(id);
  const {data: work} = useGetAmbassadorWorkQuery(id);
  const {data: reports} = useGetAmbassadorReportsQuery(id);

  if (isLoading) {
    return (
      <DetailScreenSkeleton
        title="Ambassador Profile"
        onBack={() => navigation.goBack()}
        sections={[
          ['half', 'half', 'half', 'half', 'half', 'half', 'full'],
          ['full'],
          ['full'],
        ]}
      />
    );
  }

  if (isError || !ambassador) {
    return (
      <ScreenBackground style={styles.root}>
        <DetailTopBar title="Ambassador Profile" onBack={() => navigation.goBack()} />
        <View style={styles.loading}>
          <EmptyState
            icon={<UsersIcon size={28} color={theme.colors.primary} />}
            title="Couldn't load this ambassador"
            body="Something went wrong fetching this profile. Check your connection and try again."
            actionLabel="Retry"
            onAction={refetch}
          />
        </View>
      </ScreenBackground>
    );
  }

  const statusStyle = STATUS_STYLE[ambassador.status];
  const lastWork = [...work].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];
  const lastReport = [...reports].sort(
    (a, b) => Date.parse(b.dateTime) - Date.parse(a.dateTime),
  )[0];

  return (
    <ScreenBackground style={styles.root}>
      <DetailTopBar title="Ambassador Profile" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <PersonChip name={ambassador.name} size={78} shape="rounded" avatarOnly />
          <View style={styles.heroMeta}>
            <View style={styles.heroNameRow}>
              <Text style={styles.heroName} numberOfLines={1}>
                {ambassador.name}
              </Text>
              <StatusPill
                label={ambassador.status}
                bg={statusStyle.bg}
                fg={statusStyle.fg}
                size="md"
              />
            </View>
            <Text style={styles.heroSub}>
              ID {ambassador.reference} - @{ambassador.username}
            </Text>
          </View>
        </View>

        <DetailSection title="Ambassador Details">
          <DetailField label="Job Title" value={ambassador.jobTitle} />
          <DetailField label="Total Work" value={String(ambassador.totalWork)} />
          <DetailField label="Total Report" value={String(ambassador.totalReports)} />
          <DetailField label="No. of Cases" value={String(ambassador.cases)} />
          <DetailField label="Last Logged In" value={formatCardDate(ambassador.lastLoggedIn)} />
          <DetailField label="Points Earned" value={formatPoints(ambassador.points)} />
          <DetailField label="Rating">
            {ambassador.rating > 0 ? (
              <ScorePill score={ambassador.rating} size="md" />
            ) : (
              <Text style={styles.na}>Not rated yet</Text>
            )}
          </DetailField>
          <DetailField label="Badges" full>
            {ambassador.badges.length > 0 ? (
              <View style={styles.badgeRow}>
                {ambassador.badges.map(badge => (
                  <View key={badge} style={styles.badgeChip}>
                    <StarIcon size={13} color={theme.colors.primary} />
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.na}>No badges earned yet</Text>
            )}
          </DetailField>
        </DetailSection>

        <DetailSection
          title="All Work"
          grid={false}
          action={
            lastWork ? (
              <ViewAllLink
                label="View all work"
                onPress={() =>
                  navigation.navigate('AmbassadorsWorkList', {
                    ambassadorId: ambassador.id,
                    ambassadorName: ambassador.name,
                  })
                }
              />
            ) : undefined
          }>
          <Text style={styles.sectionSub}>The most recent work shows here.</Text>
          {lastWork ? (
            <AmbassadorWorkCard
              work={lastWork}
              ambassadorName={ambassador.name}
              onPress={item =>
                navigation.navigate('AmbassadorsWorkView', {id: item.id})
              }
            />
          ) : (
            <Text style={styles.na}>No work logged for this ambassador yet</Text>
          )}
        </DetailSection>

        <DetailSection
          title="Observation Reports"
          grid={false}
          action={
            lastReport ? (
              <ViewAllLink
                label="View past reports"
                onPress={() =>
                  navigation.navigate('AmbassadorsReportsList', {
                    ambassadorId: ambassador.id,
                    ambassadorName: ambassador.name,
                  })
                }
              />
            ) : undefined
          }>
          {lastReport ? (
            <ReportCard
              report={lastReport}
              onPress={item =>
                navigation.navigate('AmbassadorsReportView', {id: item.id})
              }
            />
          ) : (
            <Text style={styles.na}>
              No observation report has been created for this ambassador yet
            </Text>
          )}
        </DetailSection>
      </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  body: {paddingBottom: 40},
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  heroMeta: {flex: 1, minWidth: 0, gap: 7},
  heroNameRow: {flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0},
  heroName: {
    flexShrink: 1,
    fontFamily: theme.fonts.black,
    fontSize: 23,
    letterSpacing: -0.5,
    color: theme.colors.text,
  },
  heroSub: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: theme.colors.textMuted,
  },
  na: {fontFamily: theme.fonts.bold, fontSize: 13.5, color: theme.colors.textMuted},
  badgeRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
  },
  badgeText: {fontFamily: theme.fonts.black, fontSize: 12.5, color: theme.colors.primary},
  sectionSub: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  viewAll: {flexDirection: 'row', alignItems: 'center', gap: 4},
  viewAllText: {fontFamily: theme.fonts.black, fontSize: 13.5, color: theme.colors.primary},
});

export default AmbassadorProfileScreen;

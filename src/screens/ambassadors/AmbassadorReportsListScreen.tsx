import React, {useCallback, useMemo, useRef, useState} from 'react';
import {FlatList, ScrollView, StyleSheet} from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  BackToTopPill,
  DateRangeSheet,
  DetailTopBar,
  EmptyState,
  FilterChips,
  ListSearchRow,
  ListSummary,
  MultiSelectSheet,
  RecordCardSkeleton,
  SingleSelectSheet,
} from '../../components/ui';
import {ClipboardCheckIcon} from '../../components/icons';
import {useGetAmbassadorReportsQuery} from '../../graphql/features/ambassador/hooks';
import {ObservationReport} from '../../types/observationReport';
import {
  EMPTY_FILTERS,
  FIELD_LABEL,
  FILTER_FIELDS,
  FilterField,
  Filters,
  SORT_LABEL,
  SORT_OPTIONS,
  SortKey,
  applyFilters,
  applySearch,
  applySort,
  formatFilterValue,
  hasAnyFilter,
  optionsForField,
} from './reportsFiltering';
import ReportCard from '../observationReports/components/ReportCard';
import {AmbassadorsStackParamList} from './routes';
import {theme} from '../../theme';

type Navigation = NativeStackNavigationProp<AmbassadorsStackParamList, 'AmbassadorsReportsList'>;
type Route = RouteProp<AmbassadorsStackParamList, 'AmbassadorsReportsList'>;

const AmbassadorReportsListScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const {ambassadorId, ambassadorName} = route.params;

  const {
    data: reports = [],
    isLoading,
    isError,
    refetch,
  } = useGetAmbassadorReportsQuery(ambassadorId);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const listRef = useRef<FlatList<ObservationReport>>(null);

  const handleOpenReport = useCallback(
    (report: ObservationReport) => {
      navigation.navigate('AmbassadorsReportView', {id: report.id});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: ObservationReport}) => (
      <ReportCard report={item} onPress={handleOpenReport} />
    ),
    [handleOpenReport],
  );

  const visible = useMemo(
    () => applySort(applySearch(applyFilters(reports, filters), search), sort),
    [reports, filters, search, sort],
  );

  const isNarrowed = search.trim().length > 0 || hasAnyFilter(filters);

  const clearSearchAndFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  return (
    <ScreenBackground style={styles.root}>
      <DetailTopBar
        title="Past Reports"
        reference={`${ambassadorName} · ${reports.length} reports`}
        onBack={() => navigation.goBack()}
      />

      <ListSearchRow
        value={search}
        onChangeText={setSearch}
        sortOpen={sortOpen}
        onOpenSort={() => setSortOpen(true)}
        placeholder="Search by Reviewer"
      />

      <FilterChips
        fields={FILTER_FIELDS}
        fieldLabel={FIELD_LABEL}
        filters={filters}
        formatValue={formatFilterValue}
        onOpen={setOpenFilter}
        onClear={field => setFilters(current => ({...current, [field]: []}))}
      />

      {isLoading ? null : (
        <ListSummary
          total={reports.length}
          visible={visible.length}
          isNarrowed={isNarrowed}
          sortLabel={SORT_LABEL[sort]}
          noun="reports"
        />
      )}

      {isLoading ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          {Array.from({length: 4}).map((_, index) => (
            <RecordCardSkeleton key={index} />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          ref={listRef}
          data={visible}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          onScroll={e => setShowBackToTop(e.nativeEvent.contentOffset.y > 240)}
          renderItem={renderItem}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon={<ClipboardCheckIcon size={28} color={theme.colors.primary} />}
                title="Couldn't load reports"
                body="Something went wrong fetching this ambassador's reports. Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : isNarrowed ? (
              <EmptyState
                icon={<ClipboardCheckIcon size={28} color={theme.colors.primary} />}
                title="No observation report found"
                body={
                  search.trim()
                    ? `We couldn't find any observation report for "${search.trim()}". Try a different keyword or clear your filters.`
                    : "We couldn't find any observation report for these filters. Try a different keyword or clear your filters."
                }
                actionLabel="Clear search & filters"
                onAction={clearSearchAndFilters}
              />
            ) : (
              <EmptyState
                icon={<ClipboardCheckIcon size={28} color={theme.colors.primary} />}
                title="No past reports"
                body={`No observation report has been created for ${ambassadorName} yet. Reports appear here once a supervisor submits one.`}
              />
            )
          }
        />
      )}

      <BackToTopPill
        visible={showBackToTop}
        onPress={() => listRef.current?.scrollToOffset({offset: 0, animated: true})}
      />

      <SingleSelectSheet
        visible={sortOpen}
        title="Sort by"
        options={SORT_OPTIONS}
        value={sort}
        onChange={next => setSort(next as SortKey)}
        onClose={() => setSortOpen(false)}
      />

      <SingleSelectSheet
        visible={openFilter === 'score'}
        title="Filter by Score"
        options={optionsForField('score', reports)}
        value={filters.score[0] ?? ''}
        onChange={next => setFilters(current => ({...current, score: [next]}))}
        onClose={() => setOpenFilter(null)}
      />

      <MultiSelectSheet
        visible={openFilter === 'reviewedBy'}
        title="Filter by Reviewed By"
        options={optionsForField('reviewedBy', reports)}
        value={filters.reviewedBy}
        onApply={next => setFilters(current => ({...current, reviewedBy: next}))}
        onClose={() => setOpenFilter(null)}
      />

      <DateRangeSheet
        visible={openFilter === 'dateRange'}
        value={filters.dateRange[0] ?? null}
        onApply={next =>
          setFilters(current => ({...current, dateRange: next ? [next] : []}))
        }
        onClose={() => setOpenFilter(null)}
      />
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
});

export default AmbassadorReportsListScreen;

import React, {useCallback, useMemo, useRef, useState} from 'react';
import {View, Text, FlatList, ScrollView, StyleSheet} from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ObservationReportsStackParamList} from './routes';
import {
  BackToTopPill,
  DateRangeSheet,
  EmptyState,
  FilterChips,
  ListSearchRow,
  ListSummary,
  MultiSelectSheet,
  RecordCardSkeleton,
  SingleSelectSheet,
} from '../../components/ui';
import {ClipboardCheckIcon} from '../../components/icons';
import {useGetObservationReportsQuery} from '../../graphql/features/observationReport/hooks';
import {ObservationReport, ObservationReportType} from '../../types/observationReport';
import {
  EMPTY_FILTERS,
  FIELD_LABEL,
  FILTER_FIELDS,
  FilterField,
  Filters,
  SINGLE_FIELDS,
  SORT_LABEL,
  SORT_OPTIONS,
  SortKey,
  applyBucket,
  applyFilters,
  applySearch,
  applySort,
  formatFilterValue,
  hasAnyFilter,
  isSearchable,
  optionsForField,
} from './filtering';
import ReportCard from './components/ReportCard';
import ReportTabSwitcher from './components/ReportTabSwitcher';
import {theme} from '../../theme';

type ListNavigation = NativeStackNavigationProp<
  ObservationReportsStackParamList,
  'ObservationReportsList'
>;

const ObservationReportsScreen: React.FC = () => {
  const {data: items = [], isLoading, isError, refetch} = useGetObservationReportsQuery();

  const [tab, setTab] = useState<ObservationReportType>('Ambassador');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const navigation = useNavigation<ListNavigation>();
  const listRef = useRef<FlatList<ObservationReport>>(null);

  const handleOpenReport = useCallback(
    (report: ObservationReport) => {
      navigation.navigate('ObservationReportsView', {id: report.id});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: ObservationReport}) => (
      <ReportCard report={item} onPress={handleOpenReport} />
    ),
    [handleOpenReport],
  );

  const ambassadorCount = useMemo(
    () => items.filter(i => i.type === 'Ambassador').length,
    [items],
  );
  const supervisorCount = useMemo(
    () => items.filter(i => i.type === 'Supervisor').length,
    [items],
  );

  const bucketItems = useMemo(() => applyBucket(items, tab), [items, tab]);
  const visible = useMemo(
    () =>
      applySort(applySearch(applyFilters(bucketItems, filters), search), sort),
    [bucketItems, filters, search, sort],
  );

  const isNarrowed = search.trim().length > 0 || hasAnyFilter(filters);

  const clearSearchAndFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>Observation Reports</Text>

        <View style={styles.tabsRow}>
          <ReportTabSwitcher
            tab={tab}
            ambassadorCount={ambassadorCount}
            supervisorCount={supervisorCount}
            onChange={next => {
              setTab(next);
              setSearch('');
              setFilters(EMPTY_FILTERS);
            }}
          />
        </View>

        <ListSearchRow
          style={styles.searchRowSpacing}
          value={search}
          onChangeText={setSearch}
          sortOpen={sortOpen}
          onOpenSort={() => setSortOpen(true)}
          placeholder="Search by Name"
        />
      </SafeAreaView>

      <FilterChips
        fields={FILTER_FIELDS}
        fieldLabel={FIELD_LABEL}
        filters={filters}
        formatValue={formatFilterValue}
        onOpen={setOpenFilter}
        onClear={field => setFilters(current => ({...current, [field]: []}))}
      />

      {/* Held back while loading, otherwise it flashes "0 reports". */}
      {isLoading ? null : (
        <ListSummary
          total={bucketItems.length}
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
          {Array.from({length: 5}).map((_, index) => (
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
          scrollEventThrottle={16}
          onScroll={e => setShowBackToTop(e.nativeEvent.contentOffset.y > 240)}
          renderItem={renderItem}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon={<ClipboardCheckIcon size={28} color={theme.colors.primary} />}
                title="Couldn't load reports"
                body="Something went wrong fetching your observation reports. Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : isNarrowed ? (
              <EmptyState
                icon={<ClipboardCheckIcon size={28} color={theme.colors.primary} />}
                title="No reports found"
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
                title="No reports found"
                body={
                  tab === 'Ambassador'
                    ? 'Ambassador observation reports will appear here once one is submitted.'
                    : 'Supervisor observation reports will appear here once one is submitted.'
                }
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
        options={optionsForField('score')}
        value={filters.score[0] ?? ''}
        onChange={next =>
          setFilters(current => ({...current, score: [next]}))
        }
        onClose={() => setOpenFilter(null)}
      />

      <MultiSelectSheet
        visible={openFilter !== null && !SINGLE_FIELDS.includes(openFilter)}
        title={openFilter ? `Filter by ${FIELD_LABEL[openFilter]}` : ''}
        options={openFilter ? optionsForField(openFilter) : []}
        value={openFilter ? filters[openFilter] : []}
        searchable={openFilter ? isSearchable(openFilter) : false}
        onApply={next => {
          if (openFilter) {
            setFilters(current => ({...current, [openFilter]: next}));
          }
        }}
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
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 26,
    letterSpacing: -0.6,
    color: '#181B1F',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  tabsRow: {paddingHorizontal: theme.spacing.lg},
  /** Same as Work — the tab switcher sits above the search row. */
  searchRowSpacing: {marginTop: theme.spacing.md},
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
});

export default ObservationReportsScreen;

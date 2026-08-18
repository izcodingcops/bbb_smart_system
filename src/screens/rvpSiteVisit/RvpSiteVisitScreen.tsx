import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Text, FlatList, ScrollView, StyleSheet} from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AddRequestsSheet from '../../components/AddRequestsSheet';
import {
  BackToTopPill,
  DateRangeSheet,
  EmptyState,
  FilterChips,
  GradientFab,
  ListSearchRow,
  ListSummary,
  MultiSelectSheet,
  RecordCardSkeleton,
  SingleSelectSheet,
  Toast,
} from '../../components/ui';
import {MapPinIcon} from '../../components/icons';
import {useGetRvpSiteVisitsQuery} from '../../graphql/features/rvpSiteVisit/hooks';
import {RvpSiteVisit} from '../../types/rvpSiteVisit';
import {GetShiftTypes} from '../../redux/auth/selectors';
import {GetActiveShiftTypeId} from '../../redux/shift/selectors';
import {SCREEN} from '../../navigation/screens';
import {useAddRequestTiles} from '../../hooks/useAddRequestTiles';
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
  applyFilters,
  applySearch,
  applySort,
  formatFilterValue,
  hasAnyFilter,
  isSearchable,
  optionsForField,
} from './filtering';
import RvpSiteVisitCard from './components/RvpSiteVisitCard';
import {RvpSiteVisitStackParamList, RvpSiteVisitToast} from './routes';
import {theme} from '../../theme';

type ListNavigation = NativeStackNavigationProp<
  RvpSiteVisitStackParamList,
  'RvpSiteVisitList'
>;

const RvpSiteVisitScreen: React.FC = () => {
  const {data: visits = [], isLoading, isError, refetch} = useGetRvpSiteVisitsQuery();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toast, setToast] = useState<RvpSiteVisitToast | null>(null);
  const navigation = useNavigation<ListNavigation>();
  const route = useRoute<RouteProp<RvpSiteVisitStackParamList, 'RvpSiteVisitList'>>();
  const listRef = useRef<FlatList<RvpSiteVisit>>(null);
  const {queueTile, flushTile} = useAddRequestTiles(SCREEN.rvpSiteVisit);

  // A toast handed back on the way out shows once, then the param is cleared so
  // returning here later doesn't replay it.
  const incomingToast = route.params?.toast;
  useEffect(() => {
    if (!incomingToast) {
      return;
    }
    setToast(incomingToast);
    navigation.setParams({toast: undefined});
  }, [incomingToast, navigation]);

  const handleOpenVisit = useCallback(
    (visit: RvpSiteVisit) => {
      navigation.navigate('RvpSiteVisitView', {id: visit.id});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: RvpSiteVisit}) => (
      <RvpSiteVisitCard visit={item} onPress={handleOpenVisit} />
    ),
    [handleOpenVisit],
  );

  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();
  const shiftName = shiftTypes.find(t => t.id === shiftTypeId)?.name ?? 'Shift';

  const visible = useMemo(
    () => applySort(applySearch(applyFilters(visits, filters), search), sort),
    [visits, filters, search, sort],
  );

  const isNarrowed = search.trim().length > 0 || hasAnyFilter(filters);

  const clearSearchAndFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>
          RVP Site Visits
          {/* The design pairs the title with a total. Its own is a hardcoded
              148 against twelve rows; this counts what is actually loaded. */}
          {isLoading ? null : (
            <Text style={styles.titleCount}> ({visits.length})</Text>
          )}
        </Text>

        <ListSearchRow
          value={search}
          onChangeText={setSearch}
          sortOpen={sortOpen}
          onOpenSort={() => setSortOpen(true)}
          placeholder="Search operation manager"
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
          total={visits.length}
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
                icon={<MapPinIcon size={28} color={theme.colors.primary} />}
                title="Couldn't load reports"
                body="Something went wrong fetching your site visit reports. Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : isNarrowed ? (
              <EmptyState
                icon={<MapPinIcon size={28} color={theme.colors.primary} />}
                title="No reports found"
                body={
                  search.trim()
                    ? `We couldn't find any RVP site visit report for "${search.trim()}". Try a different keyword or clear your filters.`
                    : "We couldn't find any RVP site visit report for these filters. Try a different keyword or clear your filters."
                }
                actionLabel="Clear search & filters"
                onAction={clearSearchAndFilters}
              />
            ) : (
              <EmptyState
                icon={<MapPinIcon size={28} color={theme.colors.primary} />}
                title="No reports found"
                body="RVP site visit reports will appear here once one is filed."
              />
            )
          }
        />
      )}

      <BackToTopPill
        visible={showBackToTop}
        onPress={() => listRef.current?.scrollToOffset({offset: 0, animated: true})}
      />

      <GradientFab onPress={() => setAddOpen(true)} />

      <AddRequestsSheet
        visible={addOpen}
        shiftName={shiftName}
        // Closing here is what eventually runs the tile: queueTile only holds
        // it, and flushTile fires from onClosed once the modal is really gone.
        // Without this the sheet stays up and the tile never acts.
        onSelect={tileId => {
          setAddOpen(false);
          queueTile(tileId);
        }}
        onClose={() => setAddOpen(false)}
        onClosed={flushTile}
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
        onChange={next => setFilters(current => ({...current, score: [next]}))}
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

      <Toast
        visible={toast !== null}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
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
  titleCount: {
    fontFamily: theme.fonts.bold,
    fontSize: 19,
    letterSpacing: 0,
    color: theme.colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
});

export default RvpSiteVisitScreen;

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
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
  SingleSelectSheet,
} from '../../components/ui';
import {SendIcon} from '../../components/icons';
import {useGetDispatchesQuery} from '../../graphql/features/dispatch/hooks';
import {Dispatch} from '../../types/dispatch';
import {GetShiftTypes} from '../../redux/auth/selectors';
import {GetActiveShiftTypeId} from '../../redux/shift/selectors';
import {useAppDispatch} from '../../redux/store';
import {setTabBarHidden} from '../../redux/ui/slice';
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
} from './filtering';
import DispatchCard from './components/DispatchCard';
import ViewDispatchScreen from './ViewDispatchScreen';
import {theme} from '../../theme';

/** View is a full-screen push within the Dispatch screen. */
type DispatchRoute = {name: 'list'} | {name: 'view'; id: string};

const DispatchScreen: React.FC = () => {
  const {data: dispatches = [], isLoading, isError, refetch} = useGetDispatchesQuery();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [queuedTile, setQueuedTile] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [route, setRoute] = useState<DispatchRoute>({name: 'list'});
  const dispatch = useAppDispatch();
  const listRef = useRef<FlatList<Dispatch>>(null);

  // View is a full-screen push — the tab bar has no place there.
  useEffect(() => {
    dispatch(setTabBarHidden(route.name !== 'list'));
    return () => {
      dispatch(setTabBarHidden(false));
    };
  }, [dispatch, route.name]);

  const handleOpenDispatch = useCallback((record: Dispatch) => {
    setRoute({name: 'view', id: record.id});
  }, []);

  const renderItem = useCallback(
    ({item}: {item: Dispatch}) => (
      <DispatchCard dispatch={item} onPress={handleOpenDispatch} />
    ),
    [handleOpenDispatch],
  );

  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();
  const shiftName = shiftTypes.find(t => t.id === shiftTypeId)?.name ?? 'Shift';

  const visible = useMemo(
    () => applySort(applySearch(applyFilters(dispatches, filters), search), sort),
    [dispatches, filters, search, sort],
  );

  const isNarrowed = search.trim().length > 0 || hasAnyFilter(filters);

  const clearSearchAndFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  if (route.name === 'view') {
    return (
      <ViewDispatchScreen
        id={route.id}
        onClose={() => setRoute({name: 'list'})}
      />
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>Dispatch</Text>

        <ListSearchRow
          value={search}
          onChangeText={setSearch}
          placeholder="Search Dispatch Case No"
          sortOpen={sortOpen}
          onOpenSort={() => setSortOpen(true)}
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

      {/* Held back while loading, otherwise it flashes "0 dispatches". */}
      {isLoading ? null : (
        <ListSummary
          total={dispatches.length}
          visible={visible.length}
          isNarrowed={isNarrowed}
          sortLabel={SORT_LABEL[sort]}
          noun="dispatches"
        />
      )}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
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
                icon={<SendIcon size={28} color={theme.colors.primary} />}
                title="Couldn't load dispatches"
                body="Something went wrong fetching your dispatch cases. Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : isNarrowed ? (
              <EmptyState
                icon={<SendIcon size={28} color={theme.colors.primary} />}
                title="No dispatches found"
                body={
                  search.trim()
                    ? `We couldn't find any dispatch case for "${search.trim()}". Try a different case number or clear your filters.`
                    : 'No dispatch cases match these filters. Try clearing them.'
                }
                actionLabel="Clear search & filters"
                onAction={clearSearchAndFilters}
              />
            ) : (
              <EmptyState
                icon={<SendIcon size={28} color={theme.colors.primary} />}
                title="No dispatches to show yet"
                body="Dispatch cases assigned to your program will appear here for you to review."
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

      <SingleSelectSheet
        visible={sortOpen}
        title="Sort by"
        options={SORT_OPTIONS}
        value={sort}
        onChange={next => setSort(next as SortKey)}
        onClose={() => setSortOpen(false)}
      />

      <MultiSelectSheet
        visible={openFilter !== null && openFilter !== 'dateRange'}
        title={openFilter ? `Filter by ${FIELD_LABEL[openFilter]}` : ''}
        options={openFilter ? optionsForField(dispatches, openFilter) : []}
        value={openFilter ? filters[openFilter] : []}
        searchable={openFilter === 'howReferred'}
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
        onApply={next => setFilters(current => ({...current, dateRange: next ? [next] : []}))}
        onClose={() => setOpenFilter(null)}
      />

      {/* Every tile is "Coming soon": there is no dispatch create flow, and a
          module's real create flow lives only behind its own tab. */}
      <AddRequestsSheet
        visible={addOpen}
        shiftName={shiftName}
        onSelect={tileId => {
          setAddOpen(false);
          setQueuedTile(tileId);
        }}
        onClose={() => setAddOpen(false)}
        onClosed={() => {
          if (queuedTile) {
            Alert.alert('Coming soon', `"${queuedTile}" is not wired up yet.`);
            setQueuedTile(null);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 26,
    letterSpacing: -0.6,
    color: '#181B1F',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    // Clears the FAB so the last card isn't trapped under it.
    paddingBottom: 96,
    gap: theme.spacing.md,
  },
});

export default DispatchScreen;

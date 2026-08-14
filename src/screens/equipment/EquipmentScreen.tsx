import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FlatList, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ScreenBackground from '../../components/ScreenBackground';
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
  SegmentedButtons,
  SingleSelectSheet,
  Toast,
} from '../../components/ui';
import {BoxIcon} from '../../components/icons';
import {useGetEquipmentQuery} from '../../graphql/features/equipment/hooks';
import {Equipment} from '../../types/equipment';
import {GetShiftTypes} from '../../redux/auth/selectors';
import {GetActiveShiftTypeId} from '../../redux/shift/selectors';
import {SCREEN} from '../../navigation/screens';
import {useAddRequestTiles} from '../../hooks/useAddRequestTiles';
import {
  ALL_FILTER_FIELDS,
  ALL_SORT_OPTIONS,
  AllFilterField,
  AllFilters,
  AllSortKey,
  EMPTY_ALL_FILTERS,
  EMPTY_MINE_FILTERS,
  FIELD_LABEL,
  MINE_FILTER_FIELDS,
  MINE_SORT_OPTIONS,
  MineFilterField,
  MineFilters,
  MineSortKey,
  SORT_LABEL,
  applyFilters,
  applySearch,
  applySort,
  formatFilterValue,
  hasAnyFilter,
  optionsForField,
} from './filtering';
import EquipmentCard from './components/EquipmentCard';
import {
  usePendingEquipmentItems,
  useQueuedEquipmentIds,
} from './pendingEquipmentItems';
import {EquipmentStackParamList, EquipmentToast} from './routes';
import {theme} from '../../theme';

type ListNavigation = NativeStackNavigationProp<
  EquipmentStackParamList,
  'EquipmentList'
>;

type Tab = 'all' | 'mine';

const TABS = [
  {value: 'all', label: 'All Equipment'},
  {value: 'mine', label: 'Checked-Out'},
];

const EquipmentScreen: React.FC = () => {
  const {data: queryEquipment = [], isLoading, isError, refetch} = useGetEquipmentQuery();
  const queuedEquipmentIds = useQueuedEquipmentIds();
  const pendingEquipment = usePendingEquipmentItems();

  // A queued custody mutation (check-out/check-in/add upkeep) targets a
  // record that already exists in the list — unlike a queued create there's
  // nothing to prepend. Mark the matching row queuedOffline so its card can
  // show the queued badge while the record still reads correctly. Memoized
  // so the array keeps a stable identity (and skips a new array entirely
  // when nothing is queued) for the memoized cards downstream.
  const knownEquipment = useMemo(
    () =>
      queuedEquipmentIds.size === 0
        ? queryEquipment
        : queryEquipment.map(item =>
            queuedEquipmentIds.has(item.id) ? {...item, queuedOffline: true} : item,
          ),
    [queryEquipment, queuedEquipmentIds],
  );

  // A queued create has no record to mark, so it's prepended as a synthetic
  // row instead — the same shape FixtureScreen uses. It only ever joins the
  // All pool: `mine` below reads off the real records, because a record that
  // hasn't been created yet cannot be checked out to anyone.
  const equipment = useMemo(
    () =>
      pendingEquipment.length === 0
        ? knownEquipment
        : [...pendingEquipment, ...knownEquipment],
    [pendingEquipment, knownEquipment],
  );

  const [tab, setTab] = useState<Tab>('all');

  // The two tabs keep genuinely independent state: different sort options,
  // different chips, and switching tabs must not carry a search term across.
  const [allSearch, setAllSearch] = useState('');
  const [allSort, setAllSort] = useState<AllSortKey>('newest');
  const [allFilters, setAllFilters] = useState<AllFilters>(EMPTY_ALL_FILTERS);
  const [mineSearch, setMineSearch] = useState('');
  const [mineSort, setMineSort] = useState<MineSortKey>('newest');
  const [mineFilters, setMineFilters] = useState<MineFilters>(EMPTY_MINE_FILTERS);

  const [sortOpen, setSortOpen] = useState(false);
  const [openFilter, setOpenFilter] = useState<AllFilterField | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toast, setToast] = useState<EquipmentToast | null>(null);

  const navigation = useNavigation<ListNavigation>();
  const route = useRoute<RouteProp<EquipmentStackParamList, 'EquipmentList'>>();
  const listRef = useRef<FlatList<Equipment>>(null);
  const {queueTile, flushTile} = useAddRequestTiles(SCREEN.equipment);

  // View hands a toast back on the way out — show it once, then clear the
  // param so returning here later doesn't replay it.
  const incomingToast = route.params?.toast;
  useEffect(() => {
    if (!incomingToast) {
      return;
    }
    setToast(incomingToast);
    navigation.setParams({toast: undefined});
  }, [incomingToast, navigation]);

  // Home's "View All" opens this screen straight on the Checked-Out tab.
  // Applied via an effect rather than a useState initialiser because the tab
  // stays mounted once visited — a second visit never re-runs initial state.
  const incomingTab = route.params?.initialTab;
  useEffect(() => {
    if (!incomingTab) {
      return;
    }
    setTab(incomingTab);
    navigation.setParams({initialTab: undefined});
  }, [incomingTab, navigation]);

  const mineEquipment = useMemo(
    () => knownEquipment.filter(item => item.mine),
    [knownEquipment],
  );

  const pool = tab === 'all' ? equipment : mineEquipment;
  const search = tab === 'all' ? allSearch : mineSearch;
  const sort: AllSortKey = tab === 'all' ? allSort : mineSort;
  const isNarrowed =
    search.trim().length > 0 ||
    (tab === 'all' ? hasAnyFilter(allFilters) : hasAnyFilter(mineFilters));

  const visible = useMemo(() => {
    const filtered =
      tab === 'all'
        ? applyFilters(equipment, allFilters)
        : applyFilters(mineEquipment, mineFilters);
    return applySort(applySearch(filtered, search), sort);
  }, [tab, equipment, mineEquipment, allFilters, mineFilters, search, sort]);

  const handleOpen = useCallback(
    (record: Equipment) => navigation.navigate('EquipmentView', {id: record.id}),
    [navigation],
  );
  const handleCheckOut = useCallback(
    (record: Equipment) =>
      navigation.navigate('EquipmentCheckOut', {id: record.id}),
    [navigation],
  );
  const handleCheckIn = useCallback(
    (record: Equipment) => navigation.navigate('EquipmentCheckIn', {id: record.id}),
    [navigation],
  );
  const handleAddUpkeep = useCallback(
    (record: Equipment) =>
      navigation.navigate('EquipmentAddUpkeep', {id: record.id, origin: 'list'}),
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: Equipment}) => (
      <EquipmentCard
        equipment={item}
        variant={tab}
        onPress={handleOpen}
        onCheckOut={handleCheckOut}
        onCheckIn={handleCheckIn}
        onAddUpkeep={handleAddUpkeep}
      />
    ),
    [tab, handleOpen, handleCheckOut, handleCheckIn, handleAddUpkeep],
  );

  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();
  const shiftName = shiftTypes.find(t => t.id === shiftTypeId)?.name ?? 'Shift';

  const setSearch = (next: string) =>
    tab === 'all' ? setAllSearch(next) : setMineSearch(next);

  const clearSearchAndFilters = () => {
    if (tab === 'all') {
      setAllSearch('');
      setAllFilters(EMPTY_ALL_FILTERS);
    } else {
      setMineSearch('');
      setMineFilters(EMPTY_MINE_FILTERS);
    }
  };

  const applyFilterValues = (next: string[]) => {
    if (!openFilter) {
      return;
    }
    if (tab === 'all') {
      setAllFilters(current => ({...current, [openFilter]: next}));
    } else {
      setMineFilters(current => ({
        ...current,
        [openFilter as MineFilterField]: next,
      }));
    }
  };

  const currentFilterValues = openFilter
    ? tab === 'all'
      ? allFilters[openFilter]
      : mineFilters[openFilter as MineFilterField] ?? []
    : [];

  // 'mine' with nothing checked out is a distinct state from 'mine' filtered
  // down to nothing — the mockup gives them different copy and only one of
  // them offers a Clear action.
  const nothingCheckedOut = tab === 'mine' && mineEquipment.length === 0;

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>Equipment</Text>

        <View style={styles.segmentRow}>
          <SegmentedButtons
            options={TABS}
            value={tab}
            onChange={next => {
              setTab(next as Tab);
              setOpenFilter(null);
              setSortOpen(false);
            }}
          />
        </View>

        <ListSearchRow
          value={search}
          onChangeText={setSearch}
          placeholder="Search by Serial or Name"
          sortOpen={sortOpen}
          onOpenSort={() => setSortOpen(true)}
        />
      </SafeAreaView>

      {tab === 'all' ? (
        <FilterChips
          fields={ALL_FILTER_FIELDS}
          fieldLabel={FIELD_LABEL}
          filters={allFilters}
          formatValue={formatFilterValue}
          onOpen={setOpenFilter}
          onClear={field => setAllFilters(current => ({...current, [field]: []}))}
        />
      ) : (
        <FilterChips
          fields={MINE_FILTER_FIELDS}
          fieldLabel={FIELD_LABEL}
          filters={mineFilters}
          formatValue={formatFilterValue}
          onOpen={setOpenFilter}
          onClear={field => setMineFilters(current => ({...current, [field]: []}))}
        />
      )}

      {/* Held back while loading, otherwise it flashes "0 equipment". */}
      {isLoading ? null : (
        <ListSummary
          total={pool.length}
          visible={visible.length}
          isNarrowed={isNarrowed}
          sortLabel={SORT_LABEL[sort]}
          noun={tab === 'all' ? 'equipment' : 'checked out'}
        />
      )}

      {isLoading ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          {Array.from({length: 5}).map((_, index) => (
            <RecordCardSkeleton key={index} fieldCount={3} />
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
                icon={<BoxIcon size={28} color={theme.colors.primary} />}
                title="Couldn't load equipment"
                body="Something went wrong fetching the equipment list. Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : nothingCheckedOut ? (
              <EmptyState
                icon={<BoxIcon size={28} color={theme.colors.primary} />}
                title="Nothing checked out"
                body="You haven't checked out any equipment yet. Check out equipment from the All Equipment tab to see it here."
              />
            ) : isNarrowed ? (
              <EmptyState
                icon={<BoxIcon size={28} color={theme.colors.primary} />}
                title={tab === 'all' ? 'No equipment available' : 'No equipment found'}
                body={
                  search.trim()
                    ? `We couldn't find anything for "${search.trim()}". Try a different keyword or clear your filters.`
                    : 'No equipment matches these filters. Try clearing them.'
                }
                actionLabel="Clear search & filters"
                onAction={clearSearchAndFilters}
              />
            ) : (
              <EmptyState
                icon={<BoxIcon size={28} color={theme.colors.primary} />}
                title="No equipment to show yet"
                body="Equipment added to your program will appear here."
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
        options={tab === 'all' ? ALL_SORT_OPTIONS : MINE_SORT_OPTIONS}
        value={sort}
        onChange={next =>
          tab === 'all'
            ? setAllSort(next as AllSortKey)
            : setMineSort(next as MineSortKey)
        }
        onClose={() => setSortOpen(false)}
      />

      <MultiSelectSheet
        visible={openFilter !== null && openFilter !== 'dateRange'}
        title={openFilter ? `Filter by ${FIELD_LABEL[openFilter]}` : ''}
        options={openFilter ? optionsForField(pool, openFilter) : []}
        value={currentFilterValues}
        searchable={
          openFilter === 'equipmentType' ||
          openFilter === 'make' ||
          openFilter === 'model' ||
          openFilter === 'program'
        }
        onApply={applyFilterValues}
        onClose={() => setOpenFilter(null)}
      />

      <DateRangeSheet
        visible={openFilter === 'dateRange'}
        value={
          (tab === 'all' ? allFilters.dateRange[0] : mineFilters.dateRange[0]) ??
          null
        }
        onApply={next => applyFilterValues(next ? [next] : [])}
        onClose={() => setOpenFilter(null)}
      />

      <AddRequestsSheet
        visible={addOpen}
        shiftName={shiftName}
        onSelect={tileId => {
          setAddOpen(false);
          queueTile(tileId);
        }}
        onClose={() => setAddOpen(false)}
        onClosed={flushTile}
      />

      <Toast
        visible={toast !== null}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        variant={toast?.variant}
        actionLabel={toast?.routeId ? 'View' : undefined}
        onAction={
          toast?.routeId
            ? () => {
                navigation.navigate('EquipmentView', {id: toast.routeId});
                setToast(null);
              }
            : undefined
        }
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
  segmentRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    // Clears the FAB so the last card isn't trapped under it.
    paddingBottom: 96,
    gap: theme.spacing.md,
  },
});

export default EquipmentScreen;

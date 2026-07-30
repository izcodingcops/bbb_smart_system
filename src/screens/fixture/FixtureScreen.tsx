import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AddRequestsSheet from '../../components/AddRequestsSheet';
import {EmptyState, FilterChips, ListSummary, MultiSelectSheet, SingleSelectSheet, TextField, Toast} from '../../components/ui';
import {ArrowUpIcon, BoxIcon, PlusIcon, SearchIcon, SortIcon} from '../../components/icons';
import {useGetFixturesQuery, useSetFixtureStatusMutation} from '../../graphql/features/fixture/hooks';
import {Fixture, FixtureStatus} from '../../types/fixture';
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
import FixtureCard from './components/FixtureCard';
import DateRangeSheet from './components/DateRangeSheet';
import CreateFixtureScreen from './CreateFixtureScreen';
import ViewFixtureScreen from './ViewFixtureScreen';
import {theme} from '../../theme';

/** Create and View are full-screen pushes within the Fixture tab. */
type FixtureRoute = {name: 'list'} | {name: 'create'} | {name: 'view'; id: string};

interface ToastState {
  title: string;
  message: string;
  reference: string;
  variant?: 'success' | 'danger';
}

const FixtureScreen: React.FC = () => {
  const {data: fixtures = [], isLoading, isError, refetch} = useGetFixturesQuery();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [queuedTile, setQueuedTile] = useState<string | null>(null);
  /** Which card's inline status menu is open, if any — only one at a time. */
  const [menuFixtureId, setMenuFixtureId] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [route, setRoute] = useState<FixtureRoute>({name: 'list'});
  const [toast, setToast] = useState<ToastState | null>(null);
  const dispatch = useAppDispatch();
  const listRef = useRef<FlatList<Fixture>>(null);
  const {mutate: setStatus} = useSetFixtureStatusMutation();

  // Create and View are full-screen pushes — the tab bar has no place there.
  useEffect(() => {
    dispatch(setTabBarHidden(route.name !== 'list'));
    return () => {
      dispatch(setTabBarHidden(false));
    };
  }, [dispatch, route.name]);

  const handleSelectStatus = (fixture: Fixture, status: FixtureStatus) => {
    setMenuFixtureId(null);
    setStatus(fixture.id, status);
  };

  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();
  const shiftName = shiftTypes.find(t => t.id === shiftTypeId)?.name ?? 'Shift';

  const visible = useMemo(
    () => applySort(applySearch(applyFilters(fixtures, filters), search), sort),
    [fixtures, filters, search, sort],
  );

  const isNarrowed = search.trim().length > 0 || hasAnyFilter(filters);

  const clearSearchAndFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  if (route.name === 'create') {
    return (
      <CreateFixtureScreen
        onClose={() => setRoute({name: 'list'})}
        onCreated={reference => {
          setRoute({name: 'list'});
          setToast({
            title: 'Fixture submitted',
            message: `${reference} was added to your Work Log.`,
            reference,
          });
        }}
      />
    );
  }

  if (route.name === 'view') {
    return (
      <ViewFixtureScreen
        id={route.id}
        onClose={() => setRoute({name: 'list'})}
        onDeleted={reference => {
          setRoute({name: 'list'});
          setToast({
            title: 'Fixture deleted',
            message: `${reference} was removed from your Work Log.`,
            reference,
            variant: 'danger',
          });
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>Fixture</Text>

        <View style={styles.searchRow}>
          <TextField
            containerStyle={styles.searchField}
            placeholder="Search by ID or name"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            leadingIcon={<SearchIcon size={20} />}
          />

          <TouchableOpacity
            style={[styles.sortButton, sortOpen && styles.sortButtonActive]}
            activeOpacity={0.8}
            onPress={() => setSortOpen(true)}>
            <SortIcon size={20} color={sortOpen ? theme.colors.primary : '#475467'} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <FilterChips
        fields={FILTER_FIELDS}
        fieldLabel={FIELD_LABEL}
        filters={filters}
        formatValue={formatFilterValue}
        onOpen={setOpenFilter}
        onClear={field => setFilters(current => ({...current, [field]: []}))}
      />

      {/* Held back while loading, otherwise it flashes "0 fixtures". */}
      {isLoading ? null : (
        <ListSummary
          total={fixtures.length}
          visible={visible.length}
          isNarrowed={isNarrowed}
          sortLabel={SORT_LABEL[sort]}
          noun="fixtures"
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
          onScroll={e => {
            setShowBackToTop(e.nativeEvent.contentOffset.y > 240);
            // No outside-tap capture on an inline popover, so scrolling is
            // the dismiss gesture instead.
            if (menuFixtureId) {
              setMenuFixtureId(null);
            }
          }}
          renderItem={({item}) => (
            <FixtureCard
              fixture={item}
              onPress={record => setRoute({name: 'view', id: record.id})}
              menuOpen={menuFixtureId === item.id}
              onToggleMenu={() =>
                setMenuFixtureId(current => (current === item.id ? null : item.id))
              }
              onSelectStatus={handleSelectStatus}
            />
          )}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon={<BoxIcon size={28} color={theme.colors.primary} />}
                title="Couldn't load fixtures"
                body="Something went wrong fetching your fixtures. Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : isNarrowed ? (
              <EmptyState
                icon={<BoxIcon size={28} color={theme.colors.primary} />}
                title="No fixtures found"
                body={
                  search.trim()
                    ? `We couldn't find anything for "${search.trim()}". Try a different keyword or clear your filters.`
                    : 'No fixtures match these filters. Try clearing them.'
                }
                actionLabel="Clear search & filters"
                onAction={clearSearchAndFilters}
              />
            ) : (
              <EmptyState
                icon={<BoxIcon size={28} color={theme.colors.primary} />}
                title="No fixtures to show yet"
                body="Fixtures will appear here once you log one, and you can also create it as needed."
              />
            )
          }
        />
      )}

      {showBackToTop ? (
        <TouchableOpacity
          style={styles.backToTop}
          activeOpacity={0.85}
          onPress={() => listRef.current?.scrollToOffset({offset: 0, animated: true})}>
          <ArrowUpIcon size={14} />
          <Text style={styles.backToTopText}>Back to top</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.fabTouchable}
        activeOpacity={0.85}
        onPress={() => setAddOpen(true)}>
        <LinearGradient
          colors={['#0092FF', theme.colors.primary]}
          start={{x: 0.15, y: 0}}
          end={{x: 0.85, y: 1}}
          style={styles.fab}>
          <PlusIcon size={26} color={theme.colors.white} />
        </LinearGradient>
      </TouchableOpacity>

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
        options={openFilter ? optionsForField(fixtures, openFilter) : []}
        value={openFilter ? filters[openFilter] : []}
        searchable={openFilter === 'fixtureType'}
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

      <AddRequestsSheet
        visible={addOpen}
        shiftName={shiftName}
        onSelect={tileId => {
          setAddOpen(false);
          if (tileId === 'fixture') {
            setRoute({name: 'create'});
            return;
          }
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

      <Toast
        visible={toast !== null}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        variant={toast?.variant}
        actionLabel={toast?.variant === 'danger' ? undefined : 'View'}
        onAction={
          toast?.variant === 'danger'
            ? undefined
            : () => {
                if (toast) {
                  setRoute({name: 'view', id: toast.reference});
                }
                setToast(null);
              }
        }
        onDismiss={() => setToast(null)}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  searchField: {flex: 1},
  sortButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    // Clears the FAB so the last card isn't trapped under it.
    paddingBottom: 96,
    gap: theme.spacing.md,
  },
  backToTop: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: theme.spacing.xxl + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#99D3FF',
    backgroundColor: theme.colors.primaryLight,
    ...theme.shadow.card,
  },
  backToTopText: {fontFamily: theme.fonts.black, fontSize: 13, color: theme.colors.primary},
  fabTouchable: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 18,
    ...theme.shadow.fab,
  },
  fab: {width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
});

export default FixtureScreen;

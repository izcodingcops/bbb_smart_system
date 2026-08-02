import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, FlatList, ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AddRequestsSheet from '../../components/AddRequestsSheet';
import {BackToTopPill, DateRangeSheet, EmptyState, FilterChips, GradientFab, ListSearchRow, ListSummary, MultiSelectSheet, RecordCardSkeleton, SingleSelectSheet, Toast} from '../../components/ui';
import {BoxIcon} from '../../components/icons';
import {useGetFixturesQuery, useSetFixtureStatusMutation} from '../../graphql/features/fixture/hooks';
import {Fixture, FixtureStatus} from '../../types/fixture';
import {GetShiftTypes} from '../../redux/auth/selectors';
import {GetActiveShiftTypeId} from '../../redux/shift/selectors';
import {useAppDispatch, useAppSelector} from '../../redux/store';
import {
  clearPendingCreate,
  requestScreen,
  setTabBarHidden,
} from '../../redux/ui/slice';
import {SCREEN} from '../../navigation/screens';
import {useAddRequestTiles} from '../../hooks/useAddRequestTiles';
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
import CreateFixtureScreen from './CreateFixtureScreen';
import ViewFixtureScreen from './ViewFixtureScreen';
import {theme} from '../../theme';

/** Create and View are full-screen pushes within the Fixture tab. */
type FixtureRoute = {name: 'list'} | {name: 'create'} | {name: 'view'; id: string};

interface ToastState {
  title: string;
  message: string;
  /** Record id used by the toast's View action. Empty when there is nowhere to go. */
  routeId: string;
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
  /** Tab to go back to when create was opened from elsewhere and then closed. */
  const [returnTo, setReturnTo] = useState<string | null>(null);
  /** Which card's inline status menu is open, if any — only one at a time. */
  const [menuFixtureId, setMenuFixtureId] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [route, setRoute] = useState<FixtureRoute>({name: 'list'});
  const [toast, setToast] = useState<ToastState | null>(null);
  const dispatch = useAppDispatch();
  const listRef = useRef<FlatList<Fixture>>(null);
  const {mutate: setStatus} = useSetFixtureStatusMutation();
  const pendingCreate = useAppSelector(state => state.ui.pendingCreate);
  const {queueTile, flushTile} = useAddRequestTiles(SCREEN.fixture);

  // Someone asked for a fixture create from another tab — the navigator has
  // since brought this screen on, so open create and spend the request,
  // holding on to where they came from for an unsaved close.
  useEffect(() => {
    if (pendingCreate?.target !== SCREEN.fixture) return;
    setReturnTo(
      pendingCreate.origin === SCREEN.fixture ? null : pendingCreate.origin,
    );
    setRoute({name: 'create'});
    dispatch(clearPendingCreate());
  }, [dispatch, pendingCreate]);

  // Create and View are full-screen pushes — the tab bar has no place there.
  useEffect(() => {
    dispatch(setTabBarHidden(route.name !== 'list'));
    return () => {
      dispatch(setTabBarHidden(false));
    };
  }, [dispatch, route.name]);

  const handleSelectStatus = useCallback(
    async (fixture: Fixture, status: FixtureStatus) => {
      setMenuFixtureId(null);
      try {
        await setStatus(fixture.id, status);
      } catch {
        setToast({
          title: "Couldn't update status",
          message: `${fixture.reference} is unchanged. Check your connection and try again.`,
          routeId: '',
          variant: 'danger',
        });
      }
    },
    [setStatus],
  );

  const handleToggleMenu = useCallback((cardId: string) => {
    setMenuFixtureId(current => (current === cardId ? null : cardId));
  }, []);

  const handleOpenFixture = useCallback((record: Fixture) => {
    setRoute({name: 'view', id: record.id});
  }, []);

  const renderItem = useCallback(
    ({item}: {item: Fixture}) => (
      <FixtureCard
        fixture={item}
        onPress={handleOpenFixture}
        menuOpen={menuFixtureId === item.id}
        onToggleMenu={handleToggleMenu}
        onSelectStatus={handleSelectStatus}
      />
    ),
    [menuFixtureId, handleOpenFixture, handleToggleMenu, handleSelectStatus],
  );

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
        onClose={() => {
          setRoute({name: 'list'});
          // Closed unsaved, so the trip into this module never really
          // happened — go back where it started from.
          if (returnTo) {
            dispatch(requestScreen(returnTo));
            setReturnTo(null);
          }
        }}
        onCreated={created => {
          setRoute({name: 'list'});
          // Submitting keeps them here: the toast's View action opens the new
          // record, which only exists on this tab.
          setReturnTo(null);
          setToast({
            title: 'Fixture submitted',
            message: `${created.reference} was added to your Work Log.`,
            routeId: created.id,
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
            routeId: '',
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

        <ListSearchRow
          value={search}
          onChangeText={setSearch}
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
          onScroll={e => {
            setShowBackToTop(e.nativeEvent.contentOffset.y > 240);
            // No outside-tap capture on an inline popover, so scrolling is
            // the dismiss gesture instead.
            if (menuFixtureId) {
              setMenuFixtureId(null);
            }
          }}
          renderItem={renderItem}
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
        actionLabel={toast?.variant === 'danger' ? undefined : 'View'}
        onAction={
          toast?.variant === 'danger'
            ? undefined
            : () => {
                if (toast) {
                  setRoute({name: 'view', id: toast.routeId});
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
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    // Clears the FAB so the last card isn't trapped under it.
    paddingBottom: 96,
    gap: theme.spacing.md,
  },
});

export default FixtureScreen;

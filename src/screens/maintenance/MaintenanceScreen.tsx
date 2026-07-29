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
import AddRequestsSheet from '../../components/AddRequestsSheet';
import {
  ConfirmDialog,
  MultiSelectSheet,
  SingleSelectSheet,
  TextField,
  Toast,
} from '../../components/ui';
import {
  ArrowUpIcon,
  PlusIcon,
  SearchIcon,
  SortIcon,
} from '../../components/icons';
import {
  useGetMaintenanceRequestsQuery,
  useSetMaintenanceStatusMutation,
} from '../../graphql/features/maintenance/hooks';
import {
  MaintenanceRequest,
  MaintenanceStatus,
} from '../../types/maintenance';
import {GetShiftTypes} from '../../redux/auth/selectors';
import {GetActiveShiftTypeId} from '../../redux/shift/selectors';
import {useAppDispatch} from '../../redux/store';
import {setTabBarHidden} from '../../redux/ui/slice';
import {
  EMPTY_FILTERS,
  FilterField,
  Filters,
  SORT_LABEL,
  SORT_OPTIONS,
  SortKey,
  applyFilters,
  applySearch,
  applySort,
  countByStatus,
  hasAnyFilter,
  optionsForField,
} from './filtering';
import MaintenanceCard from './components/MaintenanceCard';
import DateRangeSheet from './components/DateRangeSheet';
import StatusMenuSheet from './components/StatusMenuSheet';
import FilterChips, {FIELD_LABEL} from './components/FilterChips';
import ListSummary from './components/ListSummary';
import MaintenanceEmptyState from './components/MaintenanceEmptyState';
import CreateMaintenanceScreen from './CreateMaintenanceScreen';
import ViewMaintenanceScreen from './ViewMaintenanceScreen';
import {theme} from '../../theme';

/** Create and View are full-screen pushes within the Maintenance tab. */
type MaintenanceRoute =
  | {name: 'list'}
  | {name: 'create'}
  | {name: 'view'; id: string};

interface ToastState {
  title: string;
  message: string;
  reference: string;
  variant?: 'success' | 'danger';
}

const MaintenanceScreen: React.FC = () => {
  const {
    data: requests = [],
    isLoading,
    isError,
    refetch,
  } = useGetMaintenanceRequestsQuery();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [queuedTile, setQueuedTile] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<MaintenanceRequest | null>(
    null,
  );
  const [completeTarget, setCompleteTarget] =
    useState<MaintenanceRequest | null>(null);
  const [queuedComplete, setQueuedComplete] =
    useState<MaintenanceRequest | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [route, setRoute] = useState<MaintenanceRoute>({name: 'list'});
  const [toast, setToast] = useState<ToastState | null>(null);
  const listRef = useRef<FlatList<MaintenanceRequest>>(null);
  const {mutate: setStatus} = useSetMaintenanceStatusMutation();
  const dispatch = useAppDispatch();

  // Create and View are full-screen pushes — the tab bar has no place there.
  useEffect(() => {
    dispatch(setTabBarHidden(route.name !== 'list'));
    return () => {
      dispatch(setTabBarHidden(false));
    };
  }, [dispatch, route.name]);

  // Completing can't be undone from here, so it always asks first; moving to
  // In-progress applies straight away.
  const handleStatusSelect = (status: MaintenanceStatus) => {
    const target = statusTarget;
    setStatusTarget(null);
    if (!target) {
      return;
    }
    if (status === 'Completed') {
      // Held until the sheet's modal is gone — iOS drops a modal presented
      // while another is still up, which silently swallowed the dialog.
      setQueuedComplete(target);
    } else {
      setStatus(target.id, status);
    }
  };

  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();
  const shiftName = shiftTypes.find(t => t.id === shiftTypeId)?.name ?? 'Shift';

  const visible = useMemo(
    () => applySort(applySearch(applyFilters(requests, filters), search), sort),
    [requests, filters, search, sort],
  );

  const counts = useMemo(() => countByStatus(requests), [requests]);
  const isNarrowed = search.trim().length > 0 || hasAnyFilter(filters);

  const clearSearchAndFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  if (route.name === 'create') {
    return (
      <CreateMaintenanceScreen
        onClose={() => setRoute({name: 'list'})}
        onCreated={reference => {
          setRoute({name: 'list'});
          setToast({
            title: 'Maintenance submitted',
            message: `${reference} was added to your Work Log.`,
            reference,
          });
        }}
      />
    );
  }

  if (route.name === 'view') {
    return (
      <ViewMaintenanceScreen
        id={route.id}
        onClose={() => setRoute({name: 'list'})}
      />
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>Maintenance</Text>

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
            <SortIcon
              size={20}
              color={sortOpen ? theme.colors.primary : '#475467'}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <FilterChips
        filters={filters}
        onOpen={setOpenFilter}
        onClear={field => setFilters(current => ({...current, [field]: []}))}
      />

      {/* Held back while loading, otherwise it flashes "0 Total · 0 Open". */}
      {isLoading ? null : (
        <ListSummary
          total={requests.length}
          open={counts.open}
          inProgress={counts.inProgress}
          visible={visible.length}
          isNarrowed={isNarrowed}
          sortLabel={SORT_LABEL[sort]}
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
          renderItem={({item}) => (
            <MaintenanceCard
              request={item}
              onPress={record => setRoute({name: 'view', id: record.id})}
              onStatusPress={setStatusTarget}
            />
          )}
          ListEmptyComponent={
            isError ? (
              <MaintenanceEmptyState
                title="Couldn't load maintenance"
                body="Something went wrong fetching your maintenance requests. Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : isNarrowed ? (
              <MaintenanceEmptyState
                title="No maintenance found"
                body={
                  search.trim()
                    ? `We couldn't find anything for "${search.trim()}". Try a different keyword or clear your filters.`
                    : 'No maintenance matches these filters. Try clearing them.'
                }
                actionLabel="Clear search & filters"
                onAction={clearSearchAndFilters}
              />
            ) : (
              <MaintenanceEmptyState
                title="No maintenance to show yet"
                body="Maintenance will appear when assigned by your supervisor, and you can also create it as needed."
              />
            )
          }
        />
      )}

      {showBackToTop ? (
        <TouchableOpacity
          style={styles.backToTop}
          activeOpacity={0.85}
          onPress={() =>
            listRef.current?.scrollToOffset({offset: 0, animated: true})
          }>
          <ArrowUpIcon size={14} />
          <Text style={styles.backToTopText}>Back to top</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setAddOpen(true)}>
        <PlusIcon size={26} color={theme.colors.white} />
      </TouchableOpacity>

      <StatusMenuSheet
        request={statusTarget}
        onSelect={handleStatusSelect}
        onClose={() => setStatusTarget(null)}
        onClosed={() => {
          if (queuedComplete) {
            setCompleteTarget(queuedComplete);
            setQueuedComplete(null);
          }
        }}
      />

      <ConfirmDialog
        visible={completeTarget !== null}
        title="Mark as Completed?"
        message={
          completeTarget
            ? `${completeTarget.id} · ${completeTarget.type} will be marked Completed and appear in your synced Work Log.`
            : ''
        }
        confirmLabel="Yes, complete"
        onConfirm={() => {
          if (completeTarget) {
            setStatus(completeTarget.id, 'Completed');
          }
          setCompleteTarget(null);
        }}
        onCancel={() => setCompleteTarget(null)}
      />

      <Toast
        visible={toast !== null}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        variant={toast?.variant}
        // A deleted record has nowhere to go, so it gets no action button.
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
        options={openFilter ? optionsForField(requests, openFilter) : []}
        value={openFilter ? filters[openFilter] : []}
        searchable={openFilter === 'type' || openFilter === 'businessName'}
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

      <AddRequestsSheet
        visible={addOpen}
        shiftName={shiftName}
        onSelect={tileId => {
          setAddOpen(false);
          if (tileId === 'maintenance') {
            setRoute({name: 'create'});
            return;
          }
          // Held until the sheet's modal is gone — iOS drops an alert
          // presented while another modal is still up.
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
  backToTopText: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.primary,
  },
  // Kept identical to HomeScreen's FAB — same size, radius, offset and shadow.
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.fab,
  },
});

export default MaintenanceScreen;

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, FlatList, ScrollView, StyleSheet, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AddRequestsSheet from '../../components/AddRequestsSheet';
import {
  BackToTopPill,
  ConfirmDialog,
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
import {ToolsIcon} from '../../components/icons';
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
  countByStatus,
  formatFilterValue,
  hasAnyFilter,
  optionsForField,
} from './filtering';
import MaintenanceCard from './components/MaintenanceCard';
import CreateMaintenanceScreen from './CreateMaintenanceScreen';
import ViewMaintenanceScreen from './ViewMaintenanceScreen';
import {usePendingMaintenanceItems} from './pendingMaintenanceItems';
import {theme} from '../../theme';

/** Create and View are full-screen pushes within the Maintenance tab. */
type MaintenanceRoute =
  | {name: 'list'}
  | {name: 'create'}
  | {name: 'view'; id: string};

interface ToastState {
  title: string;
  message: string;
  /** Record id used by the toast's View action. Empty when there is nowhere to go. */
  routeId: string;
  variant?: 'success' | 'danger';
}

const MaintenanceScreen: React.FC = () => {
  const {
    data: queryRequests = [],
    isLoading,
    isError,
    refetch,
  } = useGetMaintenanceRequestsQuery();
  const pendingRequests = usePendingMaintenanceItems();
  const requests = useMemo(
    () => [...pendingRequests, ...queryRequests],
    [pendingRequests, queryRequests],
  );

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  /** Tab to go back to when create was opened from elsewhere and then closed. */
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [completeTarget, setCompleteTarget] =
    useState<MaintenanceRequest | null>(null);
  /** Which card's inline status menu is open, if any — only one at a time. */
  const [menuRequestId, setMenuRequestId] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [route, setRoute] = useState<MaintenanceRoute>({name: 'list'});
  const [toast, setToast] = useState<ToastState | null>(null);
  const listRef = useRef<FlatList<MaintenanceRequest>>(null);
  const {mutate: setStatus} = useSetMaintenanceStatusMutation();
  const dispatch = useAppDispatch();
  const pendingCreate = useAppSelector(state => state.ui.pendingCreate);
  const {queueTile, flushTile} = useAddRequestTiles(SCREEN.maintenance);

  // Someone asked for a maintenance create from another tab — the navigator
  // has since brought this screen on, so open create and spend the request,
  // holding on to where they came from for an unsaved close.
  useEffect(() => {
    if (pendingCreate?.target !== SCREEN.maintenance) return;
    setReturnTo(
      pendingCreate.origin === SCREEN.maintenance ? null : pendingCreate.origin,
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

  // Completing can't be undone from here, so it always asks first; moving to
  // In-progress applies straight away. The menu is an inline popover, not a
  // modal, so there's no dismiss-then-open dance needed to show the dialog.
  const handleSelectStatus = useCallback(
    async (request: MaintenanceRequest, status: MaintenanceStatus) => {
      setMenuRequestId(null);
      if (status === 'Completed') {
        setCompleteTarget(request);
        return;
      }
      try {
        await setStatus(request.id, status);
      } catch {
        setToast({
          title: "Couldn't update status",
          message: `${request.reference} is unchanged. Check your connection and try again.`,
          routeId: '',
          variant: 'danger',
        });
      }
    },
    [setStatus],
  );

  const handleToggleMenu = useCallback((cardId: string) => {
    setMenuRequestId(current => (current === cardId ? null : cardId));
  }, []);

  const handleOpenRequest = useCallback((record: MaintenanceRequest) => {
    if (record.queuedOffline) {
      Alert.alert(
        'Still uploading',
        "This request hasn't finished uploading yet — it'll be available to view once you're back online.",
      );
      return;
    }
    setRoute({name: 'view', id: record.id});
  }, []);

  const renderItem = useCallback(
    ({item}: {item: MaintenanceRequest}) => (
      <MaintenanceCard
        request={item}
        onPress={handleOpenRequest}
        menuOpen={menuRequestId === item.id}
        onToggleMenu={handleToggleMenu}
        onSelectStatus={handleSelectStatus}
      />
    ),
    [menuRequestId, handleOpenRequest, handleToggleMenu, handleSelectStatus],
  );

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
          setToast(
            created.queued
              ? {
                  title: 'Saved — will upload when back online',
                  message:
                    "This request is queued and will upload automatically once you're back online.",
                  routeId: '',
                  variant: 'danger',
                }
              : {
                  title: 'Maintenance submitted',
                  message: `${created.reference} was added to your Work Log.`,
                  routeId: created.id,
                },
          );
        }}
      />
    );
  }

  if (route.name === 'view') {
    return (
      <ViewMaintenanceScreen
        id={route.id}
        onClose={() => setRoute({name: 'list'})}
        onDeleted={reference => {
          setRoute({name: 'list'});
          setToast({
            title: 'Maintenance deleted',
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
        <Text style={styles.title}>Maintenance</Text>

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

      {/* Held back while loading, otherwise it flashes "0 Total · 0 Open". */}
      {isLoading ? null : (
        <ListSummary
          total={requests.length}
          visible={visible.length}
          isNarrowed={isNarrowed}
          sortLabel={SORT_LABEL[sort]}
          noun="requests"
          breakdown={[
            {label: 'Open', value: counts.open},
            {label: 'In Progress', value: counts.inProgress},
          ]}
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
            if (menuRequestId) {
              setMenuRequestId(null);
            }
          }}
          renderItem={renderItem}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon={<ToolsIcon size={28} color={theme.colors.primary} />}
                title="Couldn't load maintenance"
                body="Something went wrong fetching your maintenance requests. Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : isNarrowed ? (
              <EmptyState
                icon={<ToolsIcon size={28} color={theme.colors.primary} />}
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
              <EmptyState
                icon={<ToolsIcon size={28} color={theme.colors.primary} />}
                title="No maintenance to show yet"
                body="Maintenance will appear when assigned by your supervisor, and you can also create it as needed."
              />
            )
          }
        />
      )}

      <BackToTopPill
        visible={showBackToTop}
        onPress={() =>
          listRef.current?.scrollToOffset({offset: 0, animated: true})
        }
      />

      <GradientFab onPress={() => setAddOpen(true)} />

      <ConfirmDialog
        visible={completeTarget !== null}
        title="Mark as Completed?"
        message={
          completeTarget
            ? `${completeTarget.reference} · ${completeTarget.type} will be marked Completed and appear in your synced Work Log.`
            : ''
        }
        confirmLabel="Yes, complete"
        icon="check"
        iconTone="success"
        confirmTone="primary"
        onConfirm={async () => {
          const target = completeTarget;
          setCompleteTarget(null);
          if (!target) {
            return;
          }
          try {
            await setStatus(target.id, 'Completed');
          } catch {
            setToast({
              title: "Couldn't complete",
              message: `${target.reference} is unchanged. Check your connection and try again.`,
              routeId: '',
              variant: 'danger',
            });
          }
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
                  setRoute({name: 'view', id: toast.routeId});
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
          queueTile(tileId);
        }}
        onClose={() => setAddOpen(false)}
        onClosed={flushTile}
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

export default MaintenanceScreen;

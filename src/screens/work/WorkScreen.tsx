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
import ScreenBackground from '../../components/ScreenBackground';
import AddRequestsSheet from '../../components/AddRequestsSheet';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {WorkStackParamList, WorkToast} from './routes';
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
  SingleSelectSheet,
  Toast,
} from '../../components/ui';
import {ClipboardCheckIcon} from '../../components/icons';
import {
  useGetWorkItemsQuery,
  useSetWorkItemStatusMutation,
} from '../../graphql/features/work/hooks';
import {WorkBucket, WorkItem, WorkStatus} from '../../types/work';
import {GetShiftTypes, GetUserRole} from '../../redux/auth/selectors';
import {GetActiveShiftTypeId} from '../../redux/shift/selectors';
import {SCREEN} from '../../navigation/screens';
import {useAddRequestTiles} from '../../hooks/useAddRequestTiles';
import {
  ASSIGNED_CATEGORY_OPTIONS,
  CATEGORY_OPTIONS,
  EMPTY_FILTERS,
  FIELD_LABEL,
  FILTER_FIELDS_BY_BUCKET,
  FilterField,
  Filters,
  SORT_LABEL,
  SORT_OPTIONS,
  SortKey,
  applyBucketScope,
  applyFilters,
  applySearch,
  applySort,
  defaultCategoryFilter,
  formatFilterValue,
  hasAnyFilter,
  optionsForField,
} from './filtering';
import WorkCard from './components/WorkCard';
import TabSwitcher from './components/TabSwitcher';
import AssigneeSheet from '../maintenance/components/AssigneeSheet';
import {usePendingWorkLogItems} from './pendingWorkItems';
import {theme} from '../../theme';

type ListNavigation = NativeStackNavigationProp<
  WorkStackParamList,
  'WorkList'
>;

/** Only these categories have a detail screen built; others fall back to a "coming soon" alert. */
const DETAIL_ROUTE = {
  Maintenance: 'WorkMaintenanceView',
  Fixture: 'WorkFixtureView',
} as const;

const WorkScreen: React.FC = () => {
  const {
    data: queryItems = [],
    isLoading,
    isError,
    refetch,
  } = useGetWorkItemsQuery();
  const pendingItems = usePendingWorkLogItems();
  const items = useMemo(() => [...pendingItems, ...queryItems], [pendingItems, queryItems]);

  const [bucket, setBucket] = useState<WorkBucket>('assigned');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  /**
   * Module is tracked per-bucket, separately from the rest of `filters` —
   * each bucket remembers its own last pick (seeded with that bucket's
   * default) rather than resetting every time the tab is switched away from
   * and back to.
   */
  const [categoryByBucket, setCategoryByBucket] = useState<
    Record<WorkBucket, string[]>
  >(() => ({
    assigned: defaultCategoryFilter('assigned'),
    unassigned: defaultCategoryFilter('unassigned'),
    completed: defaultCategoryFilter('completed'),
  }));
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<WorkItem | null>(null);
  const [assignTarget, setAssignTarget] = useState<WorkItem | null>(null);
  /** Which card's inline status menu is open, if any — only one at a time. */
  const [menuItemId, setMenuItemId] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toast, setToast] = useState<WorkToast | null>(null);
  const navigation = useNavigation<ListNavigation>();
  const route = useRoute<RouteProp<WorkStackParamList, 'WorkList'>>();
  const listRef = useRef<FlatList<WorkItem>>(null);
  const {mutate: setStatus} = useSetWorkItemStatusMutation();
  const {queueTile, flushTile} = useAddRequestTiles(SCREEN.work);

  // Detail routes hand a toast back on the way out, and a delete also asks for
  // a refetch — this list mixes several sources, so no single refetchQueries
  // covers it. Both params are spent on arrival so returning later doesn't
  // replay them.
  const {toast: incomingToast, refresh: incomingRefresh} = route.params ?? {};
  useEffect(() => {
    if (!incomingToast && !incomingRefresh) return;
    if (incomingRefresh) {
      refetch();
    }
    if (incomingToast) {
      setToast(incomingToast);
    }
    navigation.setParams({toast: undefined, refresh: undefined});
  }, [incomingToast, incomingRefresh, navigation, refetch]);

  const handleSelectStatus = useCallback(
    async (item: WorkItem, status: WorkStatus) => {
      setMenuItemId(null);
      if (status === 'Completed') {
        setCompleteTarget(item);
        return;
      }
      try {
        await setStatus(item.id, status);
      } catch {
        setToast({
          title: "Couldn't update status",
          message: `${item.reference} is unchanged. Check your connection and try again.`,
          variant: 'danger',
        });
      }
    },
    [setStatus],
  );

  const handleToggleMenu = useCallback((cardId: string) => {
    setMenuItemId(current => (current === cardId ? null : cardId));
  }, []);

  const handleOpenItem = useCallback(
    (record: WorkItem) => {
      if (record.queuedOffline) {
        Alert.alert(
          'Still uploading',
          "This entry hasn't finished uploading yet — it'll be available to view once you're back online.",
        );
        return;
      }
      if (record.category === 'Maintenance' || record.category === 'Fixture') {
        navigation.navigate(DETAIL_ROUTE[record.category], {id: record.id});
        return;
      }
      if (record.category === 'Activity') {
        navigation.navigate('WorkLogView', {id: record.id});
        return;
      }
      Alert.alert(record.reference, `${record.category} detail view is coming soon.`);
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: WorkItem}) => (
      <WorkCard
        item={item}
        onPress={handleOpenItem}
        menuOpen={menuItemId === item.id}
        onToggleMenu={handleToggleMenu}
        onSelectStatus={handleSelectStatus}
        onOpenAssign={setAssignTarget}
      />
    ),
    [menuItemId, handleOpenItem, handleToggleMenu, handleSelectStatus],
  );

  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();
  const shiftName = shiftTypes.find(t => t.id === shiftTypeId)?.name ?? 'Shift';
  const role = GetUserRole() ?? 'ambassador';

  const assignedCount = useMemo(
    () => items.filter(i => i.bucket === 'assigned').length,
    [items],
  );
  const unassignedCount = useMemo(
    () => items.filter(i => i.bucket === 'unassigned').length,
    [items],
  );
  const completedCount = useMemo(
    () => items.filter(i => i.bucket === 'completed').length,
    [items],
  );

  const bucketItems = useMemo(
    () => applyBucketScope(items, bucket),
    [items, bucket],
  );
  /** Module's current value merged in from its own per-bucket state — see
   *  `categoryByBucket` above for why it isn't just part of `filters`. */
  const effectiveFilters = useMemo(
    () => ({...filters, category: categoryByBucket[bucket]}),
    [filters, categoryByBucket, bucket],
  );
  /** Which chips the current bucket shows — also scopes applyFilters/
   *  hasAnyFilter below so a stale selection from a chip another bucket
   *  showed never silently keeps filtering here. */
  const filterFields = FILTER_FIELDS_BY_BUCKET[bucket];
  const visible = useMemo(
    () =>
      applySort(
        applySearch(applyFilters(bucketItems, effectiveFilters, filterFields), search),
        sort,
      ),
    [bucketItems, effectiveFilters, filterFields, search, sort],
  );
  const categoryOptions =
    bucket === 'assigned' ? ASSIGNED_CATEGORY_OPTIONS : CATEGORY_OPTIONS;

  // Module is mandatory on Assigned/Completed and always has a value, so it
  // never counts as "narrowing" the way an optional filter does.
  const isNarrowed = search.trim().length > 0 || hasAnyFilter(filters, filterFields);

  const clearSearchAndFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>Work</Text>

        <View style={styles.tabsRow}>
          <TabSwitcher
            bucket={bucket}
            role={role}
            assignedCount={assignedCount}
            unassignedCount={unassignedCount}
            completedCount={completedCount}
            onChange={next => {
              setBucket(next);
              setMenuItemId(null);
              // Module's selection lives in categoryByBucket, keyed by
              // bucket, so it's already remembered — nothing to reset here.
            }}
          />
        </View>

        <ListSearchRow
          style={styles.searchRowSpacing}
          value={search}
          onChangeText={setSearch}
          sortOpen={sortOpen}
          onOpenSort={() => setSortOpen(true)}
        />
      </SafeAreaView>

      <FilterChips
        fields={filterFields}
        fieldLabel={FIELD_LABEL}
        filters={effectiveFilters}
        formatValue={formatFilterValue}
        onOpen={setOpenFilter}
        onClear={field => setFilters(current => ({...current, [field]: []}))}
        // Module always holds exactly one value on Assigned/Completed —
        // there's no "cleared" state, so its chip keeps the chevron instead
        // of turning into a removable "✕".
        nonClearable={['category']}
      />

      {/* Held back while loading, otherwise it flashes "0 assignments". */}
      {isLoading ? null : (
        <ListSummary
          total={bucketItems.length}
          visible={visible.length}
          isNarrowed={isNarrowed}
          sortLabel={SORT_LABEL[sort]}
          noun={bucket === 'completed' ? 'records' : 'assignments'}
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
            if (menuItemId) {
              setMenuItemId(null);
            }
          }}
          renderItem={renderItem}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon={<ClipboardCheckIcon size={28} color={theme.colors.primary} />}
                title="Couldn't load work"
                body="Something went wrong fetching your work items. Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : isNarrowed ? (
              <EmptyState
                icon={<ClipboardCheckIcon size={28} color={theme.colors.primary} />}
                title="No results found"
                body={
                  search.trim()
                    ? `We couldn't find anything for "${search.trim()}". Try a different keyword or clear your filters.`
                    : 'No work matches these filters. Try clearing them.'
                }
                actionLabel="Clear search & filters"
                onAction={clearSearchAndFilters}
              />
            ) : (
              <EmptyState
                icon={<ClipboardCheckIcon size={28} color={theme.colors.primary} />}
                title={
                  bucket === 'assigned'
                    ? 'No assigned work yet'
                    : bucket === 'unassigned'
                    ? 'No un-assigned work'
                    : 'Nothing completed yet'
                }
                body={
                  bucket === 'assigned'
                    ? 'Work will appear here once assigned by your supervisor.'
                    : bucket === 'unassigned'
                    ? 'Maintenance routed to you by ambassadors will show up here.'
                    : 'Completed work will show up here once you finish an assignment.'
                }
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
            setToast({
              title: 'Saved to Work Log',
              message: `You have successfully saved ${target.type}.`,
            });
          } catch {
            setToast({
              title: "Couldn't complete",
              message: `${target.reference} is unchanged. Check your connection and try again.`,
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
        actionLabel={toast?.variant === 'danger' ? undefined : 'View'}
        onAction={
          toast?.variant === 'danger'
            ? undefined
            : () => {
                setBucket('completed');
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
        visible={
          openFilter !== null &&
          openFilter !== 'dateRange' &&
          openFilter !== 'category'
        }
        title={openFilter ? `Filter by ${FIELD_LABEL[openFilter]}` : ''}
        options={openFilter ? optionsForField(bucketItems, openFilter) : []}
        value={openFilter ? filters[openFilter] : []}
        searchable={openFilter === 'type' || openFilter === 'assignee' || openFilter === 'sentBy'}
        onApply={next => {
          if (openFilter) {
            setFilters(current => ({...current, [openFilter]: next}));
          }
        }}
        onClose={() => setOpenFilter(null)}
      />

      {/* Category is single-select on this screen — only one of Maintenance/
          Activity (Assigned) or one of five categories (Completed) can show
          at a time, so it gets a radio sheet instead of the checkbox one. */}
      <SingleSelectSheet
        visible={openFilter === 'category'}
        title={`Filter by ${FIELD_LABEL.category}`}
        options={categoryOptions}
        value={categoryByBucket[bucket][0] ?? ''}
        onChange={next =>
          setCategoryByBucket(current => ({...current, [bucket]: [next]}))
        }
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

      <AssigneeSheet
        target={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={(item, name) =>
          setToast({
            title: 'Maintenance assigned',
            message: `${item.reference} is now with ${name} — moved out of Unassigned.`,
          })
        }
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
  /** Work adds a top margin because the tab switcher sits above the search row. */
  searchRowSpacing: {marginTop: theme.spacing.md},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    // Clears the FAB so the last card isn't trapped under it.
    paddingBottom: 96,
    gap: theme.spacing.md,
  },
});

export default WorkScreen;

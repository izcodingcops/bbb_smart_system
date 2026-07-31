import React, {useCallback, useMemo, useRef, useState} from 'react';
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
  SORT_LABEL,
  SORT_OPTIONS,
  SortKey,
  applyBucket,
  applyFilters,
  applySearch,
  applySort,
  formatFilterValue,
  hasAnyFilter,
  optionsForField,
} from './filtering';
import WorkCard from './components/WorkCard';
import TabSwitcher from './components/TabSwitcher';
import {theme} from '../../theme';

interface ToastState {
  title: string;
  message: string;
  variant?: 'success' | 'danger';
}

const WorkScreen: React.FC = () => {
  const {
    data: items = [],
    isLoading,
    isError,
    refetch,
  } = useGetWorkItemsQuery();

  const [bucket, setBucket] = useState<WorkBucket>('assigned');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<WorkItem | null>(null);
  /** Which card's inline status menu is open, if any — only one at a time. */
  const [menuItemId, setMenuItemId] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const listRef = useRef<FlatList<WorkItem>>(null);
  const {mutate: setStatus} = useSetWorkItemStatusMutation();
  const {queueTile, flushTile} = useAddRequestTiles(SCREEN.work);

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

  const handleOpenItem = useCallback((record: WorkItem) => {
    Alert.alert(record.reference, 'Full detail view is not wired up yet.');
  }, []);

  const renderItem = useCallback(
    ({item}: {item: WorkItem}) => (
      <WorkCard
        item={item}
        onPress={handleOpenItem}
        menuOpen={menuItemId === item.id}
        onToggleMenu={handleToggleMenu}
        onSelectStatus={handleSelectStatus}
      />
    ),
    [menuItemId, handleOpenItem, handleToggleMenu, handleSelectStatus],
  );

  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();
  const shiftName = shiftTypes.find(t => t.id === shiftTypeId)?.name ?? 'Shift';

  const assignedCount = useMemo(
    () => items.filter(i => i.bucket === 'assigned').length,
    [items],
  );
  const completedCount = useMemo(
    () => items.filter(i => i.bucket === 'completed').length,
    [items],
  );

  const bucketItems = useMemo(() => applyBucket(items, bucket), [items, bucket]);
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
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>Work</Text>

        <View style={styles.tabsRow}>
          <TabSwitcher
            bucket={bucket}
            assignedCount={assignedCount}
            completedCount={completedCount}
            onChange={next => {
              setBucket(next);
              setMenuItemId(null);
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
        fields={FILTER_FIELDS}
        fieldLabel={FIELD_LABEL}
        filters={filters}
        formatValue={formatFilterValue}
        onOpen={setOpenFilter}
        onClear={field => setFilters(current => ({...current, [field]: []}))}
      />

      {/* Held back while loading, otherwise it flashes "0 assignments". */}
      {isLoading ? null : (
        <ListSummary
          total={bucketItems.length}
          visible={visible.length}
          isNarrowed={isNarrowed}
          sortLabel={SORT_LABEL[sort]}
          noun={bucket === 'assigned' ? 'assignments' : 'records'}
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
                    : 'Nothing completed yet'
                }
                body={
                  bucket === 'assigned'
                    ? 'Work will appear here once assigned by your supervisor.'
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
        visible={openFilter !== null && openFilter !== 'dateRange'}
        title={openFilter ? `Filter by ${FIELD_LABEL[openFilter]}` : ''}
        options={openFilter ? optionsForField(bucketItems, openFilter) : []}
        value={openFilter ? filters[openFilter] : []}
        searchable={openFilter === 'type' || openFilter === 'assignee'}
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

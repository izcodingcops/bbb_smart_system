import React, {useMemo, useRef, useState} from 'react';
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
import {
  ConfirmDialog,
  EmptyState,
  FilterChips,
  ListSummary,
  MultiSelectSheet,
  SingleSelectSheet,
  TextField,
  Toast,
} from '../../components/ui';
import {
  ArrowUpIcon,
  ClipboardCheckIcon,
  PlusIcon,
  SearchIcon,
  SortIcon,
} from '../../components/icons';
import {
  useGetWorkItemsQuery,
  useSetWorkItemStatusMutation,
} from '../../graphql/features/work/hooks';
import {WorkBucket, WorkItem, WorkStatus} from '../../types/work';
import {GetShiftTypes} from '../../redux/auth/selectors';
import {GetActiveShiftTypeId} from '../../redux/shift/selectors';
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
import DateRangeSheet from './components/DateRangeSheet';
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
  const [queuedTile, setQueuedTile] = useState<string | null>(null);
  const [completeTarget, setCompleteTarget] = useState<WorkItem | null>(null);
  /** Which card's inline status menu is open, if any — only one at a time. */
  const [menuItemId, setMenuItemId] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const listRef = useRef<FlatList<WorkItem>>(null);
  const {mutate: setStatus} = useSetWorkItemStatusMutation();

  const handleSelectStatus = (item: WorkItem, status: WorkStatus) => {
    setMenuItemId(null);
    if (status === 'Completed') {
      setCompleteTarget(item);
    } else {
      setStatus(item.id, status);
    }
  };

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
          renderItem={({item}) => (
            <WorkCard
              item={item}
              onPress={record =>
                Alert.alert(record.id, 'Full detail view is not wired up yet.')
              }
              menuOpen={menuItemId === item.id}
              onToggleMenu={() =>
                setMenuItemId(current => (current === item.id ? null : item.id))
              }
              onSelectStatus={handleSelectStatus}
            />
          )}
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

      <ConfirmDialog
        visible={completeTarget !== null}
        title="Mark as Completed?"
        message={
          completeTarget
            ? `${completeTarget.id} · ${completeTarget.type} will be marked Completed and appear in your synced Work Log.`
            : ''
        }
        confirmLabel="Yes, complete"
        icon="check"
        iconTone="success"
        confirmTone="primary"
        onConfirm={() => {
          if (completeTarget) {
            setStatus(completeTarget.id, 'Completed');
          }
          setCompleteTarget(null);
          setToast({
            title: 'Saved to Work Log',
            message: `You have successfully saved ${completeTarget?.type ?? 'this work item'}.`,
          });
        }}
        onCancel={() => setCompleteTarget(null)}
      />

      <Toast
        visible={toast !== null}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        variant={toast?.variant}
        actionLabel="View"
        onAction={() => {
          setBucket('completed');
          setToast(null);
        }}
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
  tabsRow: {paddingHorizontal: theme.spacing.lg},
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
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
  fabTouchable: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 18,
    ...theme.shadow.fab,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WorkScreen;

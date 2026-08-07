import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, FlatList, ScrollView, StyleSheet, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
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
import {AlertTriangleIcon} from '../../components/icons';
import {useGetIncidentsQuery, useSetIncidentStatusMutation} from '../../graphql/features/incident/hooks';
import {Incident, IncidentStatus} from '../../types/incident';
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
  applyFilters,
  applySearch,
  applySort,
  countByStatus,
  formatFilterValue,
  hasAnyFilter,
  optionsForField,
} from './filtering';
import IncidentCard from './components/IncidentCard';
import {usePendingIncidentItems} from './pendingIncidentItems';
import {IncidentStackParamList, IncidentToast} from './routes';
import {theme} from '../../theme';

type ListNavigation = NativeStackNavigationProp<
  IncidentStackParamList,
  'IncidentList'
>;

const IncidentScreen: React.FC = () => {
  const {data: queryIncidents = [], isLoading, isError, refetch} = useGetIncidentsQuery();
  const pendingIncidents = usePendingIncidentItems();
  const incidents = useMemo(() => [...pendingIncidents, ...queryIncidents], [pendingIncidents, queryIncidents]);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<Incident | null>(null);
  /** Which card's inline status menu is open, if any — only one at a time. */
  const [menuIncidentId, setMenuIncidentId] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toast, setToast] = useState<IncidentToast | null>(null);
  const navigation = useNavigation<ListNavigation>();
  const route = useRoute<RouteProp<IncidentStackParamList, 'IncidentList'>>();
  const listRef = useRef<FlatList<Incident>>(null);
  const {mutate: setStatus} = useSetIncidentStatusMutation();
  const {queueTile, flushTile} = useAddRequestTiles(SCREEN.incident);

  // Create and View hand a toast back on the way out — show it once, then
  // clear the param so returning here later doesn't replay it.
  const incomingToast = route.params?.toast;
  useEffect(() => {
    if (!incomingToast) return;
    setToast(incomingToast);
    navigation.setParams({toast: undefined});
  }, [incomingToast, navigation]);

  // Completing can't be undone from here, so it always asks first; moving to
  // In-progress applies straight away.
  const handleSelectStatus = useCallback(
    async (incident: Incident, status: IncidentStatus) => {
      setMenuIncidentId(null);
      if (status === 'Completed') {
        setCompleteTarget(incident);
        return;
      }
      try {
        await setStatus(incident.id, status);
      } catch {
        setToast({
          title: "Couldn't update status",
          message: `${incident.reference} is unchanged. Check your connection and try again.`,
          routeId: '',
          variant: 'danger',
        });
      }
    },
    [setStatus],
  );

  const handleToggleMenu = useCallback((cardId: string) => {
    setMenuIncidentId(current => (current === cardId ? null : cardId));
  }, []);

  const handleOpenIncident = useCallback(
    (record: Incident) => {
      if (record.queuedOffline) {
        Alert.alert(
          'Still uploading',
          "This incident hasn't finished uploading yet — it'll be available to view once you're back online.",
        );
        return;
      }
      navigation.navigate('IncidentView', {id: record.id});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: Incident}) => (
      <IncidentCard
        incident={item}
        onPress={handleOpenIncident}
        menuOpen={menuIncidentId === item.id}
        onToggleMenu={handleToggleMenu}
        onSelectStatus={handleSelectStatus}
      />
    ),
    [menuIncidentId, handleOpenIncident, handleToggleMenu, handleSelectStatus],
  );

  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();
  const shiftName = shiftTypes.find(t => t.id === shiftTypeId)?.name ?? 'Shift';

  const visible = useMemo(
    () => applySort(applySearch(applyFilters(incidents, filters), search), sort),
    [incidents, filters, search, sort],
  );

  const counts = useMemo(() => countByStatus(incidents), [incidents]);
  const isNarrowed = search.trim().length > 0 || hasAnyFilter(filters);

  const clearSearchAndFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>Incident</Text>

        <ListSearchRow value={search} onChangeText={setSearch} sortOpen={sortOpen} onOpenSort={() => setSortOpen(true)} />
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
          total={incidents.length}
          visible={visible.length}
          isNarrowed={isNarrowed}
          sortLabel={SORT_LABEL[sort]}
          noun="incidents"
          breakdown={[
            {label: 'Open', value: counts.open},
            {label: 'In Progress', value: counts.inProgress},
          ]}
        />
      )}

      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
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
            if (menuIncidentId) {
              setMenuIncidentId(null);
            }
          }}
          renderItem={renderItem}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon={<AlertTriangleIcon size={28} color={theme.colors.primary} />}
                title="Couldn't load incidents"
                body="Something went wrong fetching your incidents. Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : isNarrowed ? (
              <EmptyState
                icon={<AlertTriangleIcon size={28} color={theme.colors.primary} />}
                title="No incidents found"
                body={
                  search.trim()
                    ? `We couldn't find anything for "${search.trim()}". Try a different keyword or clear your filters.`
                    : 'No incidents match these filters. Try clearing them.'
                }
                actionLabel="Clear search & filters"
                onAction={clearSearchAndFilters}
              />
            ) : (
              <EmptyState
                icon={<AlertTriangleIcon size={28} color={theme.colors.primary} />}
                title="No incidents to show yet"
                body="Incidents will appear here once you log one, and you can also create it as needed."
              />
            )
          }
        />
      )}

      <BackToTopPill visible={showBackToTop} onPress={() => listRef.current?.scrollToOffset({offset: 0, animated: true})} />

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
        actionLabel={toast?.variant === 'danger' ? undefined : 'View'}
        onAction={
          toast?.variant === 'danger'
            ? undefined
            : () => {
                if (toast) {
                  navigation.navigate('IncidentView', {id: toast.routeId});
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
        options={openFilter ? optionsForField(incidents, openFilter) : []}
        value={openFilter ? filters[openFilter] : []}
        searchable={openFilter === 'type' || openFilter === 'outcome' || openFilter === 'businessName' || openFilter === 'person'}
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

export default IncidentScreen;

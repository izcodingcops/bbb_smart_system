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
import {UserPlusIcon} from '../../components/icons';
import {useGetPoisQuery} from '../../graphql/features/poi/hooks';
import {Poi} from '../../types/poi';
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
  formatFilterValue,
  hasAnyFilter,
  optionsForField,
} from './filtering';
import PoiCard from './components/PoiCard';
import PoiChoiceSheet, {PoiCreateKind} from './components/PoiChoiceSheet';
import {usePendingPoiItems} from './pendingPoiItems';
import {PoiStackParamList, PoiToast} from './routes';
import {theme} from '../../theme';

type ListNavigation = NativeStackNavigationProp<PoiStackParamList, 'PoiList'>;

/** Which card button was tapped, and for whom — the design confirms first. */
type PendingAction = {kind: 'interaction' | 'update'; poi: Poi};

/** Route name for each sub-record kind, keeping the literal types intact. */
const SUB_RECORD_ROUTE = {
  interaction: 'PoiCreateInteraction',
  update: 'PoiCreateUpdate',
} as const;

const PoiScreen: React.FC = () => {
  const {data: queryPois = [], isLoading, isError, refetch} = useGetPoisQuery();
  const pendingPois = usePendingPoiItems();
  const pois = useMemo(
    () => [...pendingPois, ...queryPois],
    [pendingPois, queryPois],
  );

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  /**
   * The chooser's pick, held until its modal is really gone — swapping the
   * screen out from under a live modal strands it on iOS. Same reason
   * useAddRequestTiles defers a tile.
   */
  const [chosenKind, setChosenKind] = useState<PoiCreateKind | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toast, setToast] = useState<PoiToast | null>(null);
  const navigation = useNavigation<ListNavigation>();
  const route = useRoute<RouteProp<PoiStackParamList, 'PoiList'>>();
  const listRef = useRef<FlatList<Poi>>(null);
  // The POI tile tapped from another tab goes straight to Create Person — a
  // full-screen form covers the tab switch. Tapped here it opens the three-way
  // chooser instead: it's a bottom sheet, so it would otherwise leave this list
  // in full view behind it and read as a teleport into a module.
  const openChooser = useCallback(() => setChooserOpen(true), []);
  const {queueTile, flushTile} = useAddRequestTiles(SCREEN.poi, openChooser);

  // The creates and detail hand a toast back on the way out — show it once,
  // then clear the param so returning here later doesn't replay it.
  const incomingToast = route.params?.toast;
  useEffect(() => {
    if (!incomingToast) return;
    setToast(incomingToast);
    navigation.setParams({toast: undefined});
  }, [incomingToast, navigation]);

  const handleOpenPoi = useCallback(
    (record: Poi) => {
      if (record.queuedOffline) {
        Alert.alert(
          'Still uploading',
          "This person hasn't finished uploading yet — they'll be available to view once you're back online.",
        );
        return;
      }
      navigation.navigate('PoiView', {id: record.id});
    },
    [navigation],
  );

  const handleAddInteraction = useCallback((record: Poi) => {
    setPendingAction({kind: 'interaction', poi: record});
  }, []);

  const handleAddUpdate = useCallback((record: Poi) => {
    setPendingAction({kind: 'update', poi: record});
  }, []);

  const renderItem = useCallback(
    ({item}: {item: Poi}) => (
      <PoiCard
        poi={item}
        onPress={handleOpenPoi}
        onAddInteraction={handleAddInteraction}
        onAddUpdate={handleAddUpdate}
      />
    ),
    [handleOpenPoi, handleAddInteraction, handleAddUpdate],
  );

  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();
  const shiftName = shiftTypes.find(t => t.id === shiftTypeId)?.name ?? 'Shift';

  const visible = useMemo(
    () => applySort(applySearch(applyFilters(pois, filters), search), sort),
    [pois, filters, search, sort],
  );

  const isNarrowed = search.trim().length > 0 || hasAnyFilter(filters);

  const clearSearchAndFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>POI</Text>

        <ListSearchRow
          value={search}
          onChangeText={setSearch}
          sortOpen={sortOpen}
          onOpenSort={() => setSortOpen(true)}
          placeholder="Search by name, ID or type"
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

      {/* Held back while loading, otherwise it flashes "0 people". */}
      {isLoading ? null : (
        <ListSummary
          total={pois.length}
          visible={visible.length}
          isNarrowed={isNarrowed}
          sortLabel={SORT_LABEL[sort]}
          noun="people"
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
                icon={<UserPlusIcon size={28} color={theme.colors.primary} />}
                title="Couldn't load people"
                body="Something went wrong fetching your people of interest. Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : isNarrowed ? (
              <EmptyState
                icon={<UserPlusIcon size={28} color={theme.colors.primary} />}
                title="No people found"
                body={
                  search.trim()
                    ? `We couldn't find anyone for “${search.trim()}”. Try a different keyword or clear your filters.`
                    : 'No people match these filters. Try clearing them.'
                }
                actionLabel="Clear search & filters"
                onAction={clearSearchAndFilters}
              />
            ) : (
              <EmptyState
                icon={<UserPlusIcon size={28} color={theme.colors.primary} />}
                title="No people to show yet"
                body="People of interest will appear here once you log one, and you can also create one as needed."
              />
            )
          }
        />
      )}

      <BackToTopPill
        visible={showBackToTop}
        onPress={() => listRef.current?.scrollToOffset({offset: 0, animated: true})}
      />

      {/*
        The FAB opens Add Requests, as it does on every other list screen —
        the chooser is what the sheet's own POI tile leads to, via the same-tab
        override passed to useAddRequestTiles. Opening the chooser straight from
        the FAB would strand the sheet on this one tab.
      */}
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
        options={openFilter ? optionsForField(pois, openFilter) : []}
        value={openFilter ? filters[openFilter] : []}
        searchable={openFilter === 'person' || openFilter === 'personType'}
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

      <PoiChoiceSheet
        visible={chooserOpen}
        onSelect={kind => {
          setChooserOpen(false);
          setChosenKind(kind);
        }}
        // The chooser only ever opens from this tab's own Add Requests sheet,
        // so dismissing it leaves the user on the POI list they were already
        // looking at — there is nowhere to send them back to.
        onClose={() => setChooserOpen(false)}
        onClosed={() => {
          if (!chosenKind) return;
          if (chosenKind === 'person') {
            navigation.navigate('PoiCreatePerson');
          } else {
            navigation.navigate(SUB_RECORD_ROUTE[chosenKind]);
          }
          setChosenKind(null);
        }}
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

      <ConfirmDialog
        visible={pendingAction !== null}
        title={
          pendingAction?.kind === 'update' ? 'Add update' : 'Add interaction'
        }
        message={
          pendingAction
            ? pendingAction.kind === 'update'
              ? `Log a new update for ${pendingAction.poi.name} (${pendingAction.poi.reference}). This opens the update form already linked to this person.`
              : `Log a new interaction with ${pendingAction.poi.name} (${pendingAction.poi.reference}). This opens the interaction form already linked to this person.`
            : ''
        }
        confirmLabel="Continue"
        icon="check"
        iconTone="primary"
        confirmTone="primary"
        onConfirm={() => {
          if (pendingAction) {
            navigation.navigate(SUB_RECORD_ROUTE[pendingAction.kind], {
              personId: pendingAction.poi.id,
              personName: pendingAction.poi.name,
            });
          }
          setPendingAction(null);
        }}
        onCancel={() => setPendingAction(null)}
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
                  navigation.navigate('PoiView', {id: toast.routeId});
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

export default PoiScreen;

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
import {UserPlusIcon} from '../../components/icons';
import {useGetPoisQuery} from '../../graphql/features/poi/hooks';
import {Poi, PoiDetail} from '../../types/poi';
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
import PoiCard from './components/PoiCard';
import PoiChoiceSheet, {PoiCreateKind} from './components/PoiChoiceSheet';
import CreatePoiScreen from './CreatePoiScreen';
import CreateInteractionScreen from './CreateInteractionScreen';
import CreateUpdateScreen from './CreateUpdateScreen';
import ViewPoiScreen from './ViewPoiScreen';
import {usePendingPoiItems} from './pendingPoiItems';
import {theme} from '../../theme';

/** Create and View are full-screen pushes within the POI tab. */
type PoiRoute =
  | {name: 'list'}
  | {name: 'createPerson'}
  | {name: 'createInteraction'; personId?: string; personName?: string}
  | {name: 'createUpdate'; personId?: string; personName?: string}
  | {name: 'view'; id: string};

interface ToastState {
  title: string;
  message: string;
  /** Record id used by the toast's View action. Empty when there is nowhere to go. */
  routeId: string;
  variant?: 'success' | 'danger';
}

/** Which card button was tapped, and for whom — the design confirms first. */
type PendingAction = {kind: 'interaction' | 'update'; poi: Poi};

/**
 * Both sub-record routes are reached from a `kind` that isn't a literal, and a
 * computed discriminant widens the object past the route union. Branching here
 * keeps `name` literal at both call sites.
 */
function subRecordRoute(
  kind: 'interaction' | 'update',
  personId: string,
  personName: string,
): PoiRoute {
  return kind === 'interaction'
    ? {name: 'createInteraction', personId, personName}
    : {name: 'createUpdate', personId, personName};
}

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
  /** Tab to go back to when create was opened from elsewhere and then closed. */
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [route, setRoute] = useState<PoiRoute>({name: 'list'});
  const [toast, setToast] = useState<ToastState | null>(null);
  const dispatch = useAppDispatch();
  const listRef = useRef<FlatList<Poi>>(null);
  const pendingCreate = useAppSelector(state => state.ui.pendingCreate);
  const {queueTile, flushTile} = useAddRequestTiles(SCREEN.poi);

  // Someone asked for a POI create — the navigator has since brought this
  // screen on, so act on the request and spend it.
  //
  // Where they asked from decides what opens. From another tab, the tile
  // behaves like every other Create New tile: a full-screen Create Person
  // covers the tab switch, so the switch is never seen and closing it returns
  // them where they started. The three-way chooser is a bottom sheet, so it
  // would instead leave the POI list sitting in full view behind it — the user
  // asked to create something and would appear to have been teleported into a
  // module. So the chooser is offered only when they were already on POI, where
  // a sheet over the list is exactly what it looks like.
  useEffect(() => {
    if (pendingCreate?.target !== SCREEN.poi) return;
    const alreadyHere = pendingCreate.origin === SCREEN.poi;
    setReturnTo(alreadyHere ? null : pendingCreate.origin);
    if (alreadyHere) {
      setChooserOpen(true);
    } else {
      setRoute({name: 'createPerson'});
    }
    dispatch(clearPendingCreate());
  }, [dispatch, pendingCreate]);

  // Create and View are full-screen pushes — the tab bar has no place there.
  // The chooser is a sheet over the list, so it keeps the bar.
  useEffect(() => {
    dispatch(setTabBarHidden(route.name !== 'list'));
    return () => {
      dispatch(setTabBarHidden(false));
    };
  }, [dispatch, route.name]);

  const handleOpenPoi = useCallback((record: Poi) => {
    if (record.queuedOffline) {
      Alert.alert(
        'Still uploading',
        "This person hasn't finished uploading yet — they'll be available to view once you're back online.",
      );
      return;
    }
    setRoute({name: 'view', id: record.id});
  }, []);

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

  /** Closing a create unsaved means the trip here never really happened. */
  const closeCreate = () => {
    setRoute({name: 'list'});
    if (returnTo) {
      dispatch(requestScreen(returnTo));
      setReturnTo(null);
    }
  };

  /** Shared by all three creates — only the noun and the View target differ. */
  const reportCreated = (
    created: {id: string; reference: string; queued: boolean},
    noun: 'person' | 'interaction' | 'update',
    title: string,
    message: string,
  ) => {
    setRoute({name: 'list'});
    // Submitting keeps them here: the toast's View action opens a record that
    // only exists on this tab.
    setReturnTo(null);
    setToast(
      created.queued
        ? {
            title: 'Saved — will upload when back online',
            message: `This ${noun} is queued and will upload automatically once you're back online.`,
            routeId: '',
            variant: 'danger',
          }
        : {title, message, routeId: created.id},
    );
  };

  if (route.name === 'createPerson') {
    return (
      <CreatePoiScreen
        onClose={closeCreate}
        onCreated={created =>
          reportCreated(
            created,
            'person',
            'Person submitted',
            `${created.reference} was added to your Work Log.`,
          )
        }
      />
    );
  }

  if (route.name === 'createInteraction') {
    return (
      <CreateInteractionScreen
        personId={route.personId}
        personName={route.personName}
        onClose={closeCreate}
        // `created.id` is the person's — an interaction has no screen of its
        // own, so View opens the person it was logged against.
        onCreated={created =>
          reportCreated(
            created,
            'interaction',
            'Interaction added',
            route.personName
              ? `${created.reference} was logged for ${route.personName}.`
              : `${created.reference} was logged.`,
          )
        }
      />
    );
  }

  if (route.name === 'createUpdate') {
    return (
      <CreateUpdateScreen
        personId={route.personId}
        personName={route.personName}
        onClose={closeCreate}
        onCreated={created =>
          reportCreated(
            created,
            'update',
            'Update added',
            route.personName
              ? `${created.reference} was logged for ${route.personName}.`
              : `${created.reference} was logged.`,
          )
        }
      />
    );
  }

  if (route.name === 'view') {
    const openFor = (kind: 'interaction' | 'update') => (person: PoiDetail) =>
      setRoute(subRecordRoute(kind, person.id, person.name));

    return (
      <ViewPoiScreen
        id={route.id}
        onClose={() => setRoute({name: 'list'})}
        onDeleted={reference => {
          setRoute({name: 'list'});
          setToast({
            title: 'Person deleted',
            message: `${reference} was removed from the POI list.`,
            routeId: '',
            variant: 'danger',
          });
        }}
        onAddInteraction={openFor('interaction')}
        onAddUpdate={openFor('update')}
      />
    );
  }

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
        the chooser is what the sheet's own POI tile leads to, via the
        pendingCreate handoff above. Opening the chooser straight from the FAB
        would strand the sheet on this one tab.
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
          setRoute(
            chosenKind === 'person'
              ? {name: 'createPerson'}
              : chosenKind === 'interaction'
                ? {name: 'createInteraction'}
                : {name: 'createUpdate'},
          );
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
            setRoute(
              subRecordRoute(
                pendingAction.kind,
                pendingAction.poi.id,
                pendingAction.poi.name,
              ),
            );
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

export default PoiScreen;

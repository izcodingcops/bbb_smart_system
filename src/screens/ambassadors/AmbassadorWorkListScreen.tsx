import React, {useCallback, useMemo, useRef, useState} from 'react';
import {Text, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet} from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  BackToTopPill,
  BottomSheet,
  DateRangeSheet,
  DetailTopBar,
  EmptyState,
  FilterChips,
  ListSearchRow,
  ListSummary,
  RecordCardSkeleton,
  SingleSelectSheet,
} from '../../components/ui';
import {WorkIcon} from '../../components/icons';
import {useGetAmbassadorWorkQuery} from '../../graphql/features/ambassador/hooks';
import {AmbassadorWork} from '../../types/ambassador';
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
  hasAnyFilter,
} from './workFiltering';
import AmbassadorWorkCard from './components/AmbassadorWorkCard';
import {AmbassadorsStackParamList} from './routes';
import {theme} from '../../theme';

type Navigation = NativeStackNavigationProp<AmbassadorsStackParamList, 'AmbassadorsWorkList'>;
type Route = RouteProp<AmbassadorsStackParamList, 'AmbassadorsWorkList'>;

/** Text-input filter — no other module needs this shape, so it stays local rather than a shared sheet. */
const ReportNumberSheet: React.FC<{
  visible: boolean;
  value: string;
  onApply: (value: string) => void;
  onClose: () => void;
}> = ({visible, value, onApply, onClose}) => {
  const [draft, setDraft] = useState(value);

  return (
    <BottomSheet
      visible={visible}
      title="Filter by Report #"
      onClose={onClose}
      footer={
        <>
          <TouchableOpacity
            style={[styles.sheetButton, styles.sheetReset]}
            activeOpacity={0.85}
            onPress={() => {
              setDraft('');
              onApply('');
              onClose();
            }}>
            <Text style={styles.sheetResetText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sheetButton, styles.sheetApply]}
            activeOpacity={0.85}
            onPress={() => {
              onApply(draft.trim());
              onClose();
            }}>
            <Text style={styles.sheetApplyText}>Apply</Text>
          </TouchableOpacity>
        </>
      }>
      <TextInput
        style={styles.sheetInput}
        placeholder="Enter Report Number"
        placeholderTextColor={theme.colors.textMuted}
        value={draft}
        onChangeText={setDraft}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.sheetNote}>Matches any report number that contains what you type.</Text>
    </BottomSheet>
  );
};

const AmbassadorWorkListScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const {ambassadorId, ambassadorName} = route.params;

  const {data: work = [], isLoading, isError, refetch} = useGetAmbassadorWorkQuery(ambassadorId);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const listRef = useRef<FlatList<AmbassadorWork>>(null);

  const handleOpenWork = useCallback(
    (item: AmbassadorWork) => {
      navigation.navigate('AmbassadorsWorkView', {id: item.id});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: AmbassadorWork}) => (
      <AmbassadorWorkCard work={item} ambassadorName={ambassadorName} onPress={handleOpenWork} />
    ),
    [ambassadorName, handleOpenWork],
  );

  const visible = useMemo(
    () => applySort(applySearch(applyFilters(work, filters), search), sort),
    [work, filters, search, sort],
  );

  const isNarrowed = search.trim().length > 0 || hasAnyFilter(filters);

  const clearSearchAndFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  return (
    <ScreenBackground style={styles.root}>
      <DetailTopBar title="All Work" reference={ambassadorName} onBack={() => navigation.goBack()} />

      <ListSearchRow
        value={search}
        onChangeText={setSearch}
        sortOpen={sortOpen}
        onOpenSort={() => setSortOpen(true)}
        placeholder="Search by Business Name / Report No"
      />

      <FilterChips
        fields={FILTER_FIELDS}
        fieldLabel={FIELD_LABEL}
        filters={filters}
        formatValue={(field, value) => value}
        onOpen={setOpenFilter}
        onClear={field => setFilters(current => ({...current, [field]: []}))}
      />

      {isLoading ? null : (
        <ListSummary
          total={work.length}
          visible={visible.length}
          isNarrowed={isNarrowed}
          sortLabel={SORT_LABEL[sort]}
          noun="records"
        />
      )}

      {isLoading ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          {Array.from({length: 4}).map((_, index) => (
            <RecordCardSkeleton key={index} />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          ref={listRef}
          data={visible}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          onScroll={e => setShowBackToTop(e.nativeEvent.contentOffset.y > 240)}
          renderItem={renderItem}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon={<WorkIcon size={28} color={theme.colors.primary} />}
                title="Couldn't load work"
                body="Something went wrong fetching this ambassador's work. Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : isNarrowed ? (
              <EmptyState
                icon={<WorkIcon size={28} color={theme.colors.primary} />}
                title="No work record found"
                body={
                  search.trim()
                    ? `We couldn't find any work record for "${search.trim()}". Try a different keyword or clear your filters.`
                    : "We couldn't find any work record for these filters. Try a different keyword or clear your filters."
                }
                actionLabel="Clear search & filters"
                onAction={clearSearchAndFilters}
              />
            ) : (
              <EmptyState
                icon={<WorkIcon size={28} color={theme.colors.primary} />}
                title="No work logged yet"
                body={`Work assigned to or completed by ${ambassadorName} will appear here.`}
              />
            )
          }
        />
      )}

      <BackToTopPill
        visible={showBackToTop}
        onPress={() => listRef.current?.scrollToOffset({offset: 0, animated: true})}
      />

      <SingleSelectSheet
        visible={sortOpen}
        title="Sort by"
        options={SORT_OPTIONS}
        value={sort}
        onChange={next => setSort(next as SortKey)}
        onClose={() => setSortOpen(false)}
      />

      <ReportNumberSheet
        visible={openFilter === 'reportNumber'}
        value={filters.reportNumber[0] ?? ''}
        onApply={next =>
          setFilters(current => ({...current, reportNumber: next ? [next] : []}))
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
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  sheetInput: {
    height: 46,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 14,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.text,
  },
  sheetNote: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
    lineHeight: 18,
  },
  sheetButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetReset: {backgroundColor: '#F1F3F5'},
  sheetResetText: {fontFamily: theme.fonts.black, fontSize: 15, color: '#181B1F'},
  sheetApply: {backgroundColor: theme.colors.primary},
  sheetApplyText: {fontFamily: theme.fonts.black, fontSize: 15, color: theme.colors.white},
});

export default AmbassadorWorkListScreen;

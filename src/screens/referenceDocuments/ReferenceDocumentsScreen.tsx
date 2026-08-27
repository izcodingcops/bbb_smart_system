import React, {useCallback, useMemo, useRef, useState} from 'react';
import {Text, FlatList, ScrollView, StyleSheet} from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ReferenceDocumentsStackParamList} from './routes';
import {
  BackToTopPill,
  DateRangeSheet,
  EmptyState,
  FilterChips,
  ListSearchRow,
  ListSummary,
  MultiSelectSheet,
  RecordCardSkeleton,
  SingleSelectSheet,
} from '../../components/ui';
import {FileTextIcon} from '../../components/icons';
import {
  useGetReferenceDocumentsQuery,
  useReferenceDocumentFilterOptionsQuery,
} from '../../graphql/features/referenceDocument/hooks';
import {ReferenceDocument} from '../../types/referenceDocument';
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
  isSearchable,
  optionsForField,
} from './filtering';
import ReferenceDocumentCard from './components/ReferenceDocumentCard';
import {theme} from '../../theme';

type ListNavigation = NativeStackNavigationProp<
  ReferenceDocumentsStackParamList,
  'ReferenceDocumentsList'
>;

const ReferenceDocumentsScreen: React.FC = () => {
  const {data: items = [], isLoading, isError, refetch} = useGetReferenceDocumentsQuery();
  const {data: filterOptions} = useReferenceDocumentFilterOptionsQuery();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const navigation = useNavigation<ListNavigation>();
  const listRef = useRef<FlatList<ReferenceDocument>>(null);

  const handleOpenDocument = useCallback(
    (doc: ReferenceDocument) => {
      navigation.navigate('ReferenceDocumentsView', {id: doc.id});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: ReferenceDocument}) => (
      <ReferenceDocumentCard document={item} onPress={handleOpenDocument} />
    ),
    [handleOpenDocument],
  );

  const visible = useMemo(
    () => applySort(applySearch(applyFilters(items, filters), search), sort),
    [items, filters, search, sort],
  );

  const isNarrowed = search.trim().length > 0 || hasAnyFilter(filters);

  const clearSearchAndFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>Reference Documents</Text>

        <ListSearchRow
          value={search}
          onChangeText={setSearch}
          sortOpen={sortOpen}
          onOpenSort={() => setSortOpen(true)}
          placeholder="Search by Business Name or Report No"
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

      {/* Held back while loading, otherwise it flashes "0 documents". */}
      {isLoading ? null : (
        <ListSummary
          total={items.length}
          visible={visible.length}
          isNarrowed={isNarrowed}
          sortLabel={SORT_LABEL[sort]}
          noun="documents"
        />
      )}

      {isLoading ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          {Array.from({length: 5}).map((_, index) => (
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
          scrollEventThrottle={16}
          onScroll={e => setShowBackToTop(e.nativeEvent.contentOffset.y > 240)}
          renderItem={renderItem}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon={<FileTextIcon size={28} color={theme.colors.primary} />}
                title="Couldn't load documents"
                body="Something went wrong fetching your reference documents. Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : isNarrowed ? (
              <EmptyState
                icon={<FileTextIcon size={28} color={theme.colors.primary} />}
                title="No documents found"
                body={
                  search.trim()
                    ? `We couldn't find any reference document for "${search.trim()}". Try a different keyword or clear your filters.`
                    : "We couldn't find any reference document for these filters. Try a different keyword or clear your filters."
                }
                actionLabel="Clear search & filters"
                onAction={clearSearchAndFilters}
              />
            ) : (
              <EmptyState
                icon={<FileTextIcon size={28} color={theme.colors.primary} />}
                title="No documents found"
                body="Completed cleaning activities will appear here once one is logged."
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

      <MultiSelectSheet
        visible={openFilter !== null && openFilter !== 'dateRange'}
        title={openFilter ? `Filter by ${FIELD_LABEL[openFilter]}` : ''}
        options={openFilter ? optionsForField(openFilter, filterOptions) : []}
        value={openFilter ? filters[openFilter] : []}
        searchable={openFilter ? isSearchable(openFilter, filterOptions) : false}
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
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
});

export default ReferenceDocumentsScreen;

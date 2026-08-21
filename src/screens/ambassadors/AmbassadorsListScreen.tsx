import React, {useCallback, useMemo, useRef, useState} from 'react';
import {Text, FlatList, ScrollView, StyleSheet} from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
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
import {UsersIcon} from '../../components/icons';
import {useGetAmbassadorsQuery} from '../../graphql/features/ambassador/hooks';
import {Ambassador} from '../../types/ambassador';
import {
  EMPTY_FILTERS,
  FIELD_LABEL,
  FILTER_FIELDS,
  FilterField,
  Filters,
  SINGLE_FIELDS,
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
import AmbassadorCard from './components/AmbassadorCard';
import {AmbassadorsStackParamList} from './routes';
import {theme} from '../../theme';

type ListNavigation = NativeStackNavigationProp<
  AmbassadorsStackParamList,
  'AmbassadorsList'
>;

const AmbassadorsListScreen: React.FC = () => {
  const {data: ambassadors = [], isLoading, isError, refetch} = useGetAmbassadorsQuery();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const navigation = useNavigation<ListNavigation>();
  const listRef = useRef<FlatList<Ambassador>>(null);

  const handleOpenAmbassador = useCallback(
    (ambassador: Ambassador) => {
      navigation.navigate('AmbassadorsProfile', {id: ambassador.id});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: Ambassador}) => (
      <AmbassadorCard ambassador={item} onPress={handleOpenAmbassador} />
    ),
    [handleOpenAmbassador],
  );

  const visible = useMemo(
    () => applySort(applySearch(applyFilters(ambassadors, filters), search), sort),
    [ambassadors, filters, search, sort],
  );

  const isNarrowed = search.trim().length > 0 || hasAnyFilter(filters);

  const clearSearchAndFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>
          Ambassadors
          {isLoading ? null : (
            <Text style={styles.titleCount}> ({ambassadors.length})</Text>
          )}
        </Text>

        <ListSearchRow
          value={search}
          onChangeText={setSearch}
          sortOpen={sortOpen}
          onOpenSort={() => setSortOpen(true)}
          placeholder="Search by Name, Username or ID"
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

      {isLoading ? null : (
        <ListSummary
          total={ambassadors.length}
          visible={visible.length}
          isNarrowed={isNarrowed}
          sortLabel={SORT_LABEL[sort]}
          noun="ambassadors"
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
                icon={<UsersIcon size={28} color={theme.colors.primary} />}
                title="Couldn't load ambassadors"
                body="Something went wrong fetching the directory. Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : isNarrowed ? (
              <EmptyState
                icon={<UsersIcon size={28} color={theme.colors.primary} />}
                title="No ambassadors found"
                body={
                  search.trim()
                    ? `We couldn't find any ambassador for "${search.trim()}". Try a different keyword or clear your filters.`
                    : "We couldn't find any ambassador for these filters. Try a different keyword or clear your filters."
                }
                actionLabel="Clear search & filters"
                onAction={clearSearchAndFilters}
              />
            ) : (
              <EmptyState
                icon={<UsersIcon size={28} color={theme.colors.primary} />}
                title="No ambassadors yet"
                body="Ambassadors will appear here once they're added to the roster."
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

      <SingleSelectSheet
        visible={openFilter !== null && SINGLE_FIELDS.includes(openFilter)}
        title={openFilter ? `Filter by ${FIELD_LABEL[openFilter]}` : ''}
        options={openFilter ? optionsForField(openFilter) : []}
        value={openFilter ? filters[openFilter][0] ?? '' : ''}
        onChange={next => {
          if (openFilter) {
            setFilters(current => ({...current, [openFilter]: [next]}));
          }
        }}
        onClose={() => setOpenFilter(null)}
      />

      <MultiSelectSheet
        visible={openFilter !== null && !SINGLE_FIELDS.includes(openFilter)}
        title={openFilter ? `Filter by ${FIELD_LABEL[openFilter]}` : ''}
        options={openFilter ? optionsForField(openFilter) : []}
        value={openFilter ? filters[openFilter] : []}
        searchable={openFilter ? isSearchable(openFilter) : false}
        onApply={next => {
          if (openFilter) {
            setFilters(current => ({...current, [openFilter]: next}));
          }
        }}
        onClose={() => setOpenFilter(null)}
      />

      <DateRangeSheet
        visible={openFilter === 'lastActiveDate'}
        value={filters.lastActiveDate[0] ?? null}
        onApply={next =>
          setFilters(current => ({...current, lastActiveDate: next ? [next] : []}))
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
  titleCount: {
    fontFamily: theme.fonts.bold,
    fontSize: 19,
    letterSpacing: 0,
    color: theme.colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
});

export default AmbassadorsListScreen;

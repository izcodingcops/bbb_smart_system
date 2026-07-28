import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  MultiSelectSheet,
  SingleSelectSheet,
  TextField,
} from '../../components/ui';
import {SearchIcon, SortIcon} from '../../components/icons';
import {useGetMaintenanceRequestsQuery} from '../../redux/maintenance/api';
import {
  EMPTY_FILTERS,
  FilterField,
  Filters,
  SORT_LABEL,
  SORT_OPTIONS,
  SortKey,
  applyFilters,
  applySearch,
  applySort,
  countByStatus,
  hasAnyFilter,
  optionsForField,
} from './filtering';
import MaintenanceCard from './components/MaintenanceCard';
import FilterChips, {FIELD_LABEL} from './components/FilterChips';
import ListSummary from './components/ListSummary';
import {theme} from '../../theme';

const MaintenanceScreen: React.FC = () => {
  const {data: requests = [], isLoading} = useGetMaintenanceRequestsQuery();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterField | null>(null);

  const visible = useMemo(
    () => applySort(applySearch(applyFilters(requests, filters), search), sort),
    [requests, filters, search, sort],
  );

  const counts = useMemo(() => countByStatus(requests), [requests]);
  const isNarrowed = search.trim().length > 0 || hasAnyFilter(filters);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>Maintenance</Text>

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
        filters={filters}
        onOpen={setOpenFilter}
        onClear={field => setFilters(current => ({...current, [field]: []}))}
      />

      {/* Held back while loading, otherwise it flashes "0 Total · 0 Open". */}
      {isLoading ? null : (
        <ListSummary
          total={requests.length}
          open={counts.open}
          inProgress={counts.inProgress}
          visible={visible.length}
          isNarrowed={isNarrowed}
          sortLabel={SORT_LABEL[sort]}
        />
      )}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({item}) => <MaintenanceCard request={item} />}
        />
      )}

      <SingleSelectSheet
        visible={sortOpen}
        title="Sort by"
        options={SORT_OPTIONS}
        value={sort}
        onChange={next => setSort(next as SortKey)}
        onClose={() => setSortOpen(false)}
      />

      <MultiSelectSheet
        visible={openFilter !== null}
        title={openFilter ? `Filter by ${FIELD_LABEL[openFilter]}` : ''}
        options={openFilter ? optionsForField(requests, openFilter) : []}
        value={openFilter ? filters[openFilter] : []}
        onApply={next => {
          if (openFilter) {
            setFilters(current => ({...current, [openFilter]: next}));
          }
        }}
        onClose={() => setOpenFilter(null)}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
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
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
});

export default MaintenanceScreen;

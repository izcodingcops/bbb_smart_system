import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {TextField} from '../../components/ui';
import {SearchIcon} from '../../components/icons';
import {useGetMaintenanceRequestsQuery} from '../../redux/maintenance/api';
import {
  EMPTY_FILTERS,
  Filters,
  SORT_LABEL,
  SortKey,
  applyFilters,
  applySearch,
  applySort,
  countByStatus,
  hasAnyFilter,
} from './filtering';
import MaintenanceCard from './components/MaintenanceCard';
import ListSummary from './components/ListSummary';
import {theme} from '../../theme';

const MaintenanceScreen: React.FC = () => {
  const {data: requests = [], isLoading} = useGetMaintenanceRequestsQuery();

  const [search, setSearch] = useState('');
  // Sort and filters become interactive when their sheets land in the next two
  // tasks; until then the list is always latest-first and unfiltered.
  const sort: SortKey = 'latest';
  const filters: Filters = EMPTY_FILTERS;

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
        </View>
      </SafeAreaView>

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
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
});

export default MaintenanceScreen;

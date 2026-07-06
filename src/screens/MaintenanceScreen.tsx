import React, {useState, useMemo} from 'react';
import {View, Text, TextInput, Image, TouchableOpacity, FlatList, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {theme} from '../theme';
import {useAppDispatch, useAppSelector} from '../redux/store';
import {setFilters} from '../redux/maintenance/slice';
import {useListMaintenanceQuery} from '../redux/maintenance/api';
import MaintenanceCard from '../components/MaintenanceCard';
import MaintenanceHeader from '../components/MaintenanceHeader';
import PlusIcon from '../components/icons/PlusIcon';
import OfflineSyncBanner from '../components/OfflineSyncBanner';
import {MaintenanceStackParamList} from '../navigation/MaintenanceNavigator';
import {pendingMaintenanceRecords} from '../api/services/maintenance/offlinePendingRecords';

const FILTER_CHIPS: Array<{key: 'type' | 'business' | 'priority' | 'status'; label: string}> = [
  {key: 'type', label: 'Type'},
  {key: 'business', label: 'Business Name'},
  {key: 'priority', label: 'Priority'},
  {key: 'status', label: 'Status'},
];

type Nav = NativeStackNavigationProp<MaintenanceStackParamList, 'MaintenanceList'>;

const MaintenanceScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const filters = useAppSelector(state => state.maintenance.filters);
  const {data: list = [], isLoading} = useListMaintenanceQuery({page: 1, filters});
  const pendingQueueRecords = useAppSelector(state => state.offlineQueue.pending);
  const offlinePending = useMemo(
    () => pendingMaintenanceRecords(pendingQueueRecords),
    [pendingQueueRecords],
  );
  const combinedList = [...offlinePending, ...list];
  const [search, setSearch] = useState('');

  const onSearchSubmit = () => {
    dispatch(setFilters({...filters, search}));
  };

  const toggleFilter = (key: 'type' | 'business' | 'priority' | 'status') => {
    const next = {...filters};
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = 'true';
    }
    dispatch(setFilters(next));
  };

  return (
    <View style={styles.root}>
      <MaintenanceHeader
        align="start"
        bordered
        title={
          <View style={styles.titleRow}>
            <Text style={styles.title}>Maintenance</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{combinedList.length}</Text>
            </View>
          </View>
        }
        right={
          <TouchableOpacity
            testID="maintenance-add-button"
            style={[styles.addBtn, theme.shadow.button]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MaintenanceForm', {})}>
            <PlusIcon size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />

      <View style={styles.filterSection}>
        <View style={[styles.searchBar, theme.shadow.card]}>
          <Image
            source={require('../assets/icons/search.png')}
            style={[styles.icon20, {tintColor: theme.colors.textSecondary}]}
          />
          <TextInput
            testID="maintenance-search-input"
            style={styles.searchInput}
            placeholder="Search maintenance..."
            placeholderTextColor={theme.colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSearchSubmit}
            returnKeyType="search"
          />
        </View>

        <View style={styles.chipsRow}>
          {FILTER_CHIPS.map(chip => (
            <TouchableOpacity
              key={chip.key}
              testID={`maintenance-filter-${chip.key}`}
              style={[styles.chip, filters[chip.key] && styles.chipActive]}
              activeOpacity={0.7}
              onPress={() => toggleFilter(chip.key)}>
              <Text style={[styles.chipText, filters[chip.key] && styles.chipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <OfflineSyncBanner endpoint="addMaintenance-v2" />

      <FlatList
        testID="maintenance-list"
        data={combinedList}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => (
          <MaintenanceCard
            record={item}
            disableDetails={item.status === 'Pending'}
            onPress={() => navigation.navigate('MaintenanceDetail', {id: item.id})}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Image
                  source={require('../assets/icons/maintenance_tools.png')}
                  style={styles.emptyIcon}
                />
              </View>
              <View style={styles.emptyTextGroup}>
                <Text style={styles.emptyTitle}>No maintenance to show yet</Text>
                <Text style={styles.emptyBody}>
                  Maintenance will appear when assigned by your supervisor, and you can also
                  create it as needed.
                </Text>
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  titleRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 8},
  title: {
    fontSize: theme.fontSize.xxl,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    lineHeight: 28,
  },
  badge: {
    backgroundColor: 'rgba(0,102,178,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 3,
  },
  badgeText: {
    fontFamily: theme.fonts.bold,
    color: '#131316',
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
  },
  addBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon20: {width: 20, height: 20},
  icon24: {width: 24, height: 24},
  filterSection: {paddingHorizontal: theme.spacing.lg, paddingTop: 12, gap: 8},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary,
    padding: 0,
    lineHeight: 24,
    marginLeft: 8,
  },
  chipsRow: {flexDirection: 'row', gap: 8},
  chip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight},
  chipText: {fontFamily: theme.fonts.medium, color: '#454545', fontSize: theme.fontSize.xs},
  chipTextActive: {color: theme.colors.primary, fontFamily: theme.fonts.bold},
  listContent: {paddingTop: 12, paddingBottom: 24},
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 64,
    gap: 24,
  },
  emptyIconWrap: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(0,102,178,0.1)',
  },
  emptyIcon: {width: 28, height: 28},
  emptyTextGroup: {alignItems: 'center', gap: 10},
  emptyTitle: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBody: {
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs + 2,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default MaintenanceScreen;

import React from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {theme} from '../theme';

const FILTER_CHIPS = [
  'Type', 'Business Name', 'Priority', 'Status',
  'Date Range', 'Completed By', 'Assigned To',
];

const MaintenanceScreen: React.FC = () => {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Maintenance</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>0</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.addBtn, theme.shadow.button]} activeOpacity={0.8}>
            <Image
              source={require('../assets/icons/plus.png')}
              style={[styles.icon24, {tintColor: theme.colors.white}]}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <View style={styles.filterSection}>
          <View style={[styles.searchBar, theme.shadow.card]}>
            <Image
              source={require('../assets/icons/search.png')}
              style={[styles.icon20, {tintColor: theme.colors.textSecondary}]}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search maintenance..."
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}>
            {FILTER_CHIPS.map(chip => (
              <TouchableOpacity key={chip} style={styles.chip} activeOpacity={0.7}>
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

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
              Maintenance will appear when assigned by your supervisor, and you can also create it as needed.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  headerSafe: {backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: '#EEE'},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 12,
    paddingTop: 4,
  },
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
  scroll: {flex: 1},
  scrollContent: {paddingTop: 12, paddingBottom: 8},
  filterSection: {paddingHorizontal: theme.spacing.lg, gap: 8},
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
  chipsRow: {gap: 8},
  chip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontFamily: theme.fonts.medium,
    color: '#454545',
    fontSize: theme.fontSize.xs,
  },
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

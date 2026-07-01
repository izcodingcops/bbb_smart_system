import React from 'react';
import {View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MenuItem} from '../types/navigation';
import {locationTracker} from '../utils/locationTracker';
import {theme} from '../theme';

const ICON_MAP: Record<string, string> = {
  home: '⌂',
  maintenance: '✂',
  fixture: '⋈',
  incident: 'ⓘ',
  profile: '⊙',
};

interface MoreScreenProps {
  items: MenuItem[];
  onSelect: (screen: string) => void;
}

const MoreScreen: React.FC<MoreScreenProps> = ({items, onSelect}) => {
  const handleShareGpsLog = async () => {
    const ok = await locationTracker.shareGpsLog();
    if (!ok) {
      Alert.alert('No GPS log', 'No GPS log file has been recorded yet.');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>More</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.menuCard}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelect(item.screen_name)}
              style={[styles.menuRow, index < items.length - 1 && styles.menuRowBorder]}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>{ICON_MAP[item.menu_icon] ?? '○'}</Text>
              </View>
              <Text style={styles.menuLabel}>{item.menu_name}</Text>
              <Text style={styles.rowArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>DEBUG</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity onPress={handleShareGpsLog} style={styles.menuRow}>
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>⇪</Text>
            </View>
            <Text style={styles.menuLabel}>Share GPS Log</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F3F4F6'},
  pageHeader: {paddingHorizontal: theme.spacing.lg, paddingTop: 12, paddingBottom: 8},
  pageTitle: {fontSize: theme.fontSize.xl, fontFamily: theme.fonts.bold, color: '#111827'},
  scroll: {padding: theme.spacing.lg},
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
  },
  menuRowBorder: {borderBottomWidth: 1, borderBottomColor: '#F3F4F6'},
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuIconText: {fontSize: 18, color: theme.colors.primaryDark},
  menuLabel: {flex: 1, fontSize: theme.fontSize.base, fontFamily: theme.fonts.medium, color: '#111827'},
  rowArrow: {fontSize: 18, color: theme.colors.textMuted},
  sectionLabel: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xxl,
    marginBottom: 8,
    marginLeft: 4,
  },
});

export default MoreScreen;

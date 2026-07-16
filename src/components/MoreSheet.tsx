import React from 'react';
import {View, Text, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import BottomSheet from './ui/BottomSheet';
import {MenuGroup, MenuItem} from '../types/navigation';
import {locationTracker} from '../utils/locationTracker';
import {theme} from '../theme';

const ICON_MAP: Record<string, string> = {
  home: '⌂',
  maintenance: '✂',
  fixture: '⋈',
  incident: 'ⓘ',
  profile: '⊙',
  poi: '◎',
  dispatch: '⇄',
  equipment: '⚙',
  maps: '◈',
  reports: '▤',
  documents: '❐',
  program: '⊞',
  shift_type: '⇅',
  shift_details: '☰',
};

const GROUPS: {key: MenuGroup; label: string}[] = [
  {key: 'modules', label: 'MODULES'},
  {key: 'employee_shift', label: 'EMPLOYEE SHIFT'},
];

interface Props {
  visible: boolean;
  items: MenuItem[];
  onSelect: (screen: string) => void;
  onClose: () => void;
}

/** The "More" tab's menu, grouped into the sections the menu data declares. */
const MoreSheet: React.FC<Props> = ({visible, items, onSelect, onClose}) => {
  const handleShareGpsLog = async () => {
    const ok = await locationTracker.shareGpsLog();
    if (!ok) {
      Alert.alert('No GPS log', 'No GPS log file has been recorded yet.');
    }
  };

  return (
    <BottomSheet visible={visible} title="More" onClose={onClose}>
      {GROUPS.map(group => {
        const groupItems = items.filter(
          i => (i.menu_group ?? 'modules') === group.key,
        );
        if (groupItems.length === 0) {
          return null;
        }
        return (
          <View key={group.key}>
            <Text style={styles.sectionLabel}>{group.label}</Text>
            {groupItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => onSelect(item.screen_name)}
                style={[
                  styles.row,
                  index < groupItems.length - 1 && styles.rowBorder,
                ]}>
                <View style={styles.rowIcon}>
                  <Text style={styles.rowIconText}>
                    {ICON_MAP[item.menu_icon] ?? '○'}
                  </Text>
                </View>
                <Text style={styles.rowLabel}>{item.menu_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      })}

      <Text style={styles.sectionLabel}>DEBUG</Text>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleShareGpsLog}
        style={styles.row}>
        <View style={styles.rowIcon}>
          <Text style={styles.rowIconText}>⇪</Text>
        </View>
        <Text style={styles.rowLabel}>Share GPS Log</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: theme.fonts.black,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    letterSpacing: 0.6,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  rowIconText: {fontSize: 16, color: theme.colors.primaryDark},
  rowLabel: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.base,
    color: '#181B1F',
  },
});

export default MoreSheet;

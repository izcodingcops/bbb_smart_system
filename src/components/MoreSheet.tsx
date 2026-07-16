import React from 'react';
import {View, Text, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import BottomSheet from './ui/BottomSheet';
import {
  AlertTriangleIcon,
  BoxIcon,
  BriefcaseIcon,
  ChevronRightIcon,
  ClockIcon,
  FileTextIcon,
  MapIcon,
  RefreshIcon,
  SearchIcon,
  SendIcon,
  ToolsIcon,
  UploadIcon,
  UserIcon,
  UserPlusIcon,
} from './icons';
import {MenuGroup, MenuItem} from '../types/navigation';
import {locationTracker} from '../utils/locationTracker';
import {theme} from '../theme';

type IconComponent = React.FC<{size?: number; color?: string}>;

const ICON_MAP: Record<string, IconComponent> = {
  maintenance: ToolsIcon,
  fixture: BoxIcon,
  incident: AlertTriangleIcon,
  profile: UserIcon,
  poi: UserPlusIcon,
  dispatch: SendIcon,
  equipment: BoxIcon,
  maps: MapIcon,
  reports: SearchIcon,
  documents: FileTextIcon,
  program: BriefcaseIcon,
  shift_type: RefreshIcon,
  shift_details: ClockIcon,
};

const ROW_ICON = '#181B1F';

const GROUPS: {key: MenuGroup; label: string}[] = [
  {key: 'modules', label: 'MODULES'},
  {key: 'employee_shift', label: 'EMPLOYEE SHIFT'},
];

interface Props {
  visible: boolean;
  items: MenuItem[];
  onSelect: (screen: string) => void;
  onClose: () => void;
  /** Fired once the sheet's modal is gone — see BottomSheet's onClosed. */
  onClosed?: () => void;
}

/** The "More" tab's menu, grouped into the sections the menu data declares. */
const MoreSheet: React.FC<Props> = ({
  visible,
  items,
  onSelect,
  onClose,
  onClosed,
}) => {
  const handleShareGpsLog = async () => {
    const ok = await locationTracker.shareGpsLog();
    if (!ok) {
      Alert.alert('No GPS log', 'No GPS log file has been recorded yet.');
    }
  };

  return (
    <BottomSheet
      visible={visible}
      title="More"
      onClose={onClose}
      onClosed={onClosed}>
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
            {groupItems.map((item, index) => {
              const Icon = ICON_MAP[item.menu_icon] ?? BoxIcon;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => onSelect(item.screen_name)}
                  style={[
                    styles.row,
                    index < groupItems.length - 1 && styles.rowBorder,
                  ]}>
                  <View style={styles.rowIcon}>
                    <Icon size={20} color={ROW_ICON} />
                  </View>
                  <Text style={styles.rowLabel}>{item.menu_name}</Text>
                  <ChevronRightIcon size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}

      <Text style={styles.sectionLabel}>DEBUG</Text>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleShareGpsLog}
        style={styles.row}>
        <View style={styles.rowIcon}>
          <UploadIcon size={20} color={ROW_ICON} />
        </View>
        <Text style={styles.rowLabel}>Share GPS Log</Text>
        <ChevronRightIcon size={18} color={theme.colors.textMuted} />
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
    width: 24,
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  rowLabel: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.base,
    color: '#181B1F',
  },
});

export default MoreSheet;

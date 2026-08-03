import React from 'react';
import {Text, View, StyleSheet} from 'react-native';
import {
  CleaningIcon,
  GeneralIcon,
  HospitalityIcon,
  LockIcon,
  ManagementIcon,
  OutreachIcon,
  SafetyIcon,
} from '../../../components/icons';
import {theme} from '../../../theme';

type IconComponent = React.FC<{size?: number; color?: string}>;

/** Keyed by MOCK_SHIFT_TYPES[].icon — same map ShiftSetupScreen.tsx uses. */
const SHIFT_ICONS: Record<string, IconComponent> = {
  cleaning: CleaningIcon,
  general: GeneralIcon,
  hospitality: HospitalityIcon,
  management: ManagementIcon,
  outreach: OutreachIcon,
  safety: SafetyIcon,
};

interface Props {
  shiftTypeIcon: string;
  entryBadgeLabel: string;
  entryType: string;
}

/**
 * Read-only badge shown above the form once an entry type is locked in from
 * Step 1. The source mockup hardcodes an elevator icon here regardless of the
 * chosen entry type — this shows the active shift's own icon instead, which
 * is meaningful for every entry type rather than only the one the mockup
 * happened to demo.
 */
const EntryReadout: React.FC<Props> = ({
  shiftTypeIcon,
  entryBadgeLabel,
  entryType,
}) => {
  const Icon = SHIFT_ICONS[shiftTypeIcon] ?? GeneralIcon;
  return (
    <View style={styles.root}>
      <View style={styles.iconTile}>
        <Icon size={21} color={theme.colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{entryBadgeLabel}</Text>
        <Text style={styles.value}>{entryType}</Text>
      </View>
      <LockIcon size={16} color={theme.colors.textMuted} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginTop: 14,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    ...theme.shadow.card,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {flex: 1, minWidth: 0},
  label: {
    fontFamily: theme.fonts.black,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  value: {
    fontFamily: theme.fonts.black,
    fontSize: 16,
    color: theme.colors.text,
    marginTop: 1,
  },
});

export default EntryReadout;

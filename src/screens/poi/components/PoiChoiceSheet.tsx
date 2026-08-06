import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {BottomSheet} from '../../../components/ui';
import {
  ChevronRightIcon,
  ClockIcon,
  MessageSquareIcon,
  UserPlusIcon,
} from '../../../components/icons';
import {theme} from '../../../theme';

export type PoiCreateKind = 'person' | 'interaction' | 'update';

type IconComponent = React.FC<{size?: number; color?: string}>;

const OPTIONS: {
  kind: PoiCreateKind;
  Icon: IconComponent;
  tint: string;
  tintBg: string;
  title: string;
  description: string;
}[] = [
  {
    kind: 'person',
    Icon: UserPlusIcon,
    tint: theme.colors.primary,
    tintBg: theme.colors.primaryLight,
    title: 'POI (Person of Interest)',
    description: 'Create a new person record to track and monitor',
  },
  {
    kind: 'interaction',
    Icon: MessageSquareIcon,
    tint: '#2563EB',
    tintBg: '#DBEAFE',
    title: 'Interaction',
    description: 'Log a field contact or check-in with a person',
  },
  {
    kind: 'update',
    Icon: ClockIcon,
    tint: '#B45309',
    tintBg: '#FEF3C7',
    title: 'Update',
    description: 'Add a status note to an existing person',
  },
];

interface Props {
  visible: boolean;
  onSelect: (kind: PoiCreateKind) => void;
  onClose: () => void;
  /**
   * Forwarded to BottomSheet. Picking a row swaps the screen out from under a
   * live modal, so the caller holds the selection until this fires — the same
   * iOS hazard useAddRequestTiles exists to dodge.
   */
  onClosed?: () => void;
}

const PoiChoiceSheet: React.FC<Props> = ({
  visible,
  onSelect,
  onClose,
  onClosed,
}) => (
  <BottomSheet
    visible={visible}
    title="What do you want to create?"
    onClose={onClose}
    onClosed={onClosed}>
    <Text style={styles.subtitle}>
      Choose what you’d like to log for this person.
    </Text>

    {OPTIONS.map(option => (
      <TouchableOpacity
        key={option.kind}
        style={styles.row}
        activeOpacity={0.85}
        onPress={() => onSelect(option.kind)}>
        <View style={[styles.icon, {backgroundColor: option.tintBg}]}>
          <option.Icon size={20} color={option.tint} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{option.title}</Text>
          <Text style={styles.description}>{option.description}</Text>
        </View>
        <ChevronRightIcon size={18} color={theme.colors.textMuted} />
      </TouchableOpacity>
    ))}
  </BottomSheet>
);

const styles = StyleSheet.create({
  subtitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    lineHeight: 19,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {flex: 1, minWidth: 0, gap: 3},
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 14.5,
    color: theme.colors.text,
  },
  description: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },
});

export default PoiChoiceSheet;

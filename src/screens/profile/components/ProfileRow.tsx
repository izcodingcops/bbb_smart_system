import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {ChevronRightIcon} from '../../../components/icons';
import {theme} from '../../../theme';

interface Props {
  Icon: React.FC<{size?: number; color?: string}>;
  label: string;
  /** Trailing value text, e.g. the current language. */
  value?: string;
  /** Omitted for chevron-only rows whose page isn't built yet. */
  onPress?: () => void;
}

const ProfileRow: React.FC<Props> = ({Icon, label, value, onPress}) => {
  const content = (
    <>
      <View style={styles.iconTile}>
        <Icon size={18} color={theme.colors.primary} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <ChevronRightIcon size={18} color={theme.colors.textMuted} />
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.glass.cardBorder,
    gap: theme.spacing.md,
  },
  iconTile: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textOnGlass,
  },
  value: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: theme.colors.textOnGlassMuted,
    marginRight: theme.spacing.xs,
    maxWidth: 120,
  },
});

export default ProfileRow;

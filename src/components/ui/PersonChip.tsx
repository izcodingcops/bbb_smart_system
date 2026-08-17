import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {theme} from '../../theme';

/**
 * Initials for an avatar. The comma strip matters: several of this app's name
 * lists are in `Last, First` form, and without it 'Rizvi , Ahsann' initials to
 * 'R,' rather than 'RA'.
 */
export function initials(name: string): string {
  return name
    .replace(/,/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

interface Props {
  name: string;
  /** 'sm' is the 20px in-field chip; 'lg' the 34px card header / detail hero avatar. */
  size?: 'sm' | 'lg';
  /** Avatar without the name beside it — a card's leading slot. */
  avatarOnly?: boolean;
}

/**
 * Initials avatar with the person's name beside it.
 *
 * The designs use stock photography that this app doesn't ship, so every
 * person reads as initials on a tinted disc. Lifted out of Observation
 * Reports, where it existed twice, because `initials`/`initialsOf` is already
 * copy-pasted across nine files here and RVP Site Visit needed a tenth.
 * Migrating the remaining copies (POI, Work, Equipment, Maintenance, Incident)
 * is deliberately left as its own change.
 */
const PersonChip: React.FC<Props> = ({name, size = 'sm', avatarOnly = false}) => {
  const large = size === 'lg';
  const avatar = (
    <View style={[styles.avatar, large && styles.avatarLg]}>
      <Text style={[styles.avatarText, large && styles.avatarTextLg]}>
        {initials(name)}
      </Text>
    </View>
  );

  if (avatarOnly) {
    return avatar;
  }

  return (
    <View style={styles.row}>
      {avatar}
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 6},
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 2,
  },
  avatarText: {
    fontFamily: theme.fonts.black,
    fontSize: 9,
    color: theme.colors.primary,
  },
  avatarTextLg: {fontSize: 12},
  name: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: '#181B1F',
    flexShrink: 1,
  },
});

export default PersonChip;

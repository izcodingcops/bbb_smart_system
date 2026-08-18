import React from 'react';
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
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

/** The in-field chip, which is every caller's default. */
const DEFAULT_SIZE = 20;

/**
 * Initials scale with the tile, but the smallest one is pinned: the design sets
 * 9px on its 20px chip, which no proportional rule reaches without making the
 * larger tiles too small.
 */
function fontSizeFor(size: number): number {
  return size <= 22 ? 9 : Math.round(size * 0.35);
}

interface Props {
  name: string;
  /** Avatar diameter in px. Defaults to the 20px in-field chip. */
  size?: number;
  /**
   * 'rounded' is the design's squircle, used for the card and hero avatars
   * (`.c2-av` and `.rvh-av`); everything else is a circle. The radius is
   * derived at ~0.3 of the size, which lands within a pixel of the design's
   * own 14-at-46 and 16-at-56.
   */
  shape?: 'circle' | 'rounded';
  /** Avatar without the name beside it — a card's leading slot. */
  avatarOnly?: boolean;
  /** Applied to the avatar itself, for a caller that needs to nudge spacing. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Initials avatar with the person's name beside it.
 *
 * The designs use stock photography that this app doesn't ship, so every
 * person reads as initials on a tinted disc. Lifted out of Observation
 * Reports, where it existed twice, because `initials`/`initialsOf` is already
 * copy-pasted across nine files here.
 */
const PersonChip: React.FC<Props> = ({
  name,
  size = DEFAULT_SIZE,
  shape = 'circle',
  avatarOnly = false,
  style,
}) => {
  // Held in a variable rather than written inline, so the style prop stays an
  // identifier and doesn't trip react-native/no-inline-styles.
  const avatarSize = {
    width: size,
    height: size,
    borderRadius: shape === 'circle' ? size / 2 : Math.round(size * 0.3),
  };
  const textSize = {fontSize: fontSizeFor(size)};

  const avatar = (
    <View style={[styles.avatar, avatarSize, style]}>
      <Text style={[styles.avatarText, textSize]}>{initials(name)}</Text>
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
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.fonts.black,
    color: theme.colors.primary,
  },
  name: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: '#181B1F',
    flexShrink: 1,
  },
});

export default PersonChip;

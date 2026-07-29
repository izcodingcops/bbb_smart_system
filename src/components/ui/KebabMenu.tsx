import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {MoreVerticalIcon} from '../icons';
import {theme} from '../../theme';

export interface KebabMenuOption {
  value: string;
  label: string;
  dot: string;
}

interface Props {
  /** False hides the trigger entirely — e.g. Maintenance's canChangeStatus gate. */
  visible: boolean;
  open: boolean;
  onToggle: () => void;
  options: KebabMenuOption[];
  onSelect: (value: string) => void;
}

const KebabMenu: React.FC<Props> = ({visible, open, onToggle, options, onSelect}) => {
  if (!visible) {
    return null;
  }
  return (
    <>
      <TouchableOpacity
        style={styles.kebab}
        activeOpacity={0.7}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
        onPress={onToggle}>
        <MoreVerticalIcon size={17} />
      </TouchableOpacity>

      {open ? (
        <View style={styles.menu}>
          {options.map(option => (
            <TouchableOpacity
              key={option.value}
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => onSelect(option.value)}>
              <View style={[styles.menuDot, {backgroundColor: option.dot}]} />
              <Text style={styles.menuLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  kebab: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Anchored under the pill/kebab row — the parent (RecordCard's headerRight)
  // must be `position: 'relative'` for this to land correctly.
  menu: {
    position: 'absolute',
    top: 34,
    right: 0,
    zIndex: 20,
    elevation: 20,
    minWidth: 184,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: 6,
    shadowColor: '#101828',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.14,
    shadowRadius: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  menuDot: {width: 9, height: 9, borderRadius: 5},
  menuLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.text,
  },
});

export default React.memo(KebabMenu);

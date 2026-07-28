import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import BottomSheet from './BottomSheet';
import CheckIcon from '../icons/CheckIcon';
import {SelectOption} from './SingleSelectSheet';
import {theme} from '../../theme';

interface Props {
  visible: boolean;
  title: string;
  options: SelectOption[];
  value: string[];
  onApply: (value: string[]) => void;
  onClose: () => void;
}

/**
 * Checkbox list with a Reset/Apply footer. Selection is held as a draft so the
 * footer means something: toggling touches the draft only, Apply commits it,
 * and dismissing without Apply throws it away. The draft re-seeds from `value`
 * each time the sheet opens.
 */
const MultiSelectSheet: React.FC<Props> = ({
  visible,
  title,
  options,
  value,
  onApply,
  onClose,
}) => {
  const [draft, setDraft] = useState<string[]>(value);

  // Deliberately keyed to `visible` alone: re-seeding whenever `value` changed
  // would discard edits the moment the parent re-rendered.
  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const toggle = (optionValue: string) => {
    setDraft(current =>
      current.includes(optionValue)
        ? current.filter(v => v !== optionValue)
        : [...current, optionValue],
    );
  };

  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      {options.map(option => {
        const checked = draft.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => toggle(option.value)}>
            <View style={[styles.box, checked && styles.boxChecked]}>
              {checked ? <CheckIcon size={13} /> : null}
            </View>
            <Text style={styles.label}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.reset]}
          activeOpacity={0.85}
          onPress={() => setDraft([])}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.apply]}
          activeOpacity={0.85}
          onPress={() => {
            onApply(draft);
            onClose();
          }}>
          <Text style={styles.applyText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: '#D7DBE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  label: {fontFamily: theme.fonts.bold, fontSize: 15, color: '#181B1F'},
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reset: {backgroundColor: '#F1F3F5'},
  resetText: {fontFamily: theme.fonts.black, fontSize: 15, color: '#181B1F'},
  apply: {backgroundColor: theme.colors.primary},
  applyText: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    color: theme.colors.white,
  },
});

export default MultiSelectSheet;

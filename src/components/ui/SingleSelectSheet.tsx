import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import BottomSheet from './BottomSheet';
import {theme} from '../../theme';

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  visible: boolean;
  title: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

/**
 * Radio list with no footer: picking an option commits it and closes, which is
 * what the design's sort sheet does. Use MultiSelectSheet when the choice needs
 * a Reset/Apply cycle.
 */
const SingleSelectSheet: React.FC<Props> = ({
  visible,
  title,
  options,
  value,
  onChange,
  onClose,
}) => (
  <BottomSheet visible={visible} title={title} onClose={onClose}>
    {options.map(option => {
      const selected = option.value === value;
      return (
        <TouchableOpacity
          key={option.value}
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => {
            onChange(option.value);
            onClose();
          }}>
          <Text style={styles.label}>{option.label}</Text>
          <View style={[styles.radio, selected && styles.radioSelected]}>
            {selected ? <View style={styles.radioDot} /> : null}
          </View>
        </TouchableOpacity>
      );
    })}
  </BottomSheet>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {fontFamily: theme.fonts.bold, fontSize: 15, color: '#181B1F'},
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    borderColor: '#D7DBE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {borderColor: theme.colors.primary},
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
});

export default SingleSelectSheet;

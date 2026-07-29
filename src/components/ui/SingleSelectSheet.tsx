import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import BottomSheet from './BottomSheet';
import SearchIcon from '../icons/SearchIcon';
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
  /** Filter box above the list — for dropdowns with more than a handful. */
  searchable?: boolean;
  /** Rendered above the first row (e.g. "+ Add Fixture"). */
  headerAction?: React.ReactNode;
  /** Fired once the native modal is really gone — see BottomSheet's onClosed. */
  onClosed?: () => void;
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
  searchable = false,
  headerAction,
  onClosed,
}) => {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? options.filter(o => o.label.toLowerCase().includes(needle))
    : options;

  return (
    <BottomSheet
      visible={visible}
      title={title}
      onClosed={onClosed}
      onClose={() => {
        setQuery('');
        onClose();
      }}>
      {headerAction ? (
        <View style={styles.headerRow}>{headerAction}</View>
      ) : null}

      {searchable ? (
        <View style={styles.search}>
          <SearchIcon size={17} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search…"
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      ) : null}

      {shown.length === 0 ? <Text style={styles.empty}>No matches.</Text> : null}

      {shown.map(option => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              onChange(option.value);
              setQuery('');
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
};

const styles = StyleSheet.create({
  headerRow: {alignItems: 'flex-end', paddingBottom: theme.spacing.sm},
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 42,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F4F5F7',
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.text,
  },
  empty: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: theme.colors.textMuted,
    paddingVertical: theme.spacing.lg,
    textAlign: 'center',
  },
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

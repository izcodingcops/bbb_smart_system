import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import BottomSheet from './BottomSheet';
import CheckIcon from '../icons/CheckIcon';
import SearchIcon from '../icons/SearchIcon';
import {SelectOption} from './SingleSelectSheet';
import {theme} from '../../theme';

interface Props {
  visible: boolean;
  title: string;
  options: SelectOption[];
  value: string[];
  onApply: (value: string[]) => void;
  onClose: () => void;
  /** Filter box above the list — for dropdowns with more than a handful. */
  searchable?: boolean;
  /** Rendered above the first row (e.g. "+ Add Fixture"). */
  headerAction?: React.ReactNode;
  /** Fired once the native modal is really gone — see BottomSheet's onClosed. */
  onClosed?: () => void;
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
  searchable = false,
  headerAction,
  onClosed,
}) => {
  const [draft, setDraft] = useState<string[]>(value);
  const [query, setQuery] = useState('');

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

  const needle = query.trim().toLowerCase();
  // Filtering only decides which rows render — the draft is never touched.
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
            setQuery('');
            onClose();
          }}>
          <Text style={styles.applyText}>Apply</Text>
        </TouchableOpacity>
      </View>
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
    gap: theme.spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    // Lighter than theme.colors.border — matches the design's row hairline.
    borderBottomColor: '#EEF0F2',
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

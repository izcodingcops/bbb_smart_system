import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import CheckIcon from '../icons/CheckIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import PlusIcon from '../icons/PlusIcon';
import SearchIcon from '../icons/SearchIcon';
import XIcon from '../icons/XIcon';
import {theme} from '../../theme';

/** Any list longer than this gets a filter box inside the panel. */
const SEARCH_THRESHOLD = 6;
/** Caps the option list's own scroll so it doesn't take over the form. */
const PANEL_MAX_HEIGHT = 224;

function filterOptions(options: string[], query: string): string[] {
  const needle = query.trim().toLowerCase();
  return needle
    ? options.filter(option => option.toLowerCase().includes(needle))
    : options;
}

interface FieldLabelProps {
  label: string;
  required?: boolean;
  /** Rendered at the end of the label row (e.g. "Change Location"). */
  trailing?: React.ReactNode;
}

/** Shared label row — exported so the form's other fields match it. */
export const FieldLabel: React.FC<FieldLabelProps> = ({
  label,
  required = false,
  trailing,
}) => (
  <View style={styles.labelRow}>
    <Text style={styles.label}>
      {label}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
    {trailing}
  </View>
);

interface Props {
  label: string;
  required?: boolean;
  placeholder: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
  searchable?: boolean;
  /** Label for the panel's create button, e.g. 'Add Fixture'. */
  addLabel?: string;
  onRequestAdd?: () => void;
}

/**
 * Expands in place under the field, pushing the rest of the form down —
 * matching the design's dropdown, not a modal bottom sheet.
 */
const DropdownField: React.FC<Props> = ({
  label,
  required = false,
  placeholder,
  options,
  value,
  onChange,
  searchable,
  addLabel,
  onRequestAdd,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const canSearch = searchable ?? options.length > SEARCH_THRESHOLD;
  const shown = filterOptions(options, query);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.field}>
      <FieldLabel label={label} required={required} />
      <TouchableOpacity
        style={[styles.control, open && styles.controlOpen]}
        activeOpacity={0.85}
        onPress={() => (open ? close() : setOpen(true))}>
        <Text
          style={[styles.value, !value && styles.placeholder]}
          numberOfLines={1}>
          {/* `||`, not `??`: every form seeds its unset dropdowns with '',
              which is not nullish, so `??` rendered an empty control instead
              of the placeholder the adjacent style is already greying. */}
          {value || placeholder}
        </Text>
        <View style={open ? styles.chevOpen : undefined}>
          <ChevronDownIcon size={19} />
        </View>
      </TouchableOpacity>

      {open ? (
        <View style={styles.panel}>
          {addLabel && onRequestAdd ? (
            <View style={styles.panelHeader}>
              <TouchableOpacity
                style={styles.addButton}
                activeOpacity={0.85}
                onPress={() => {
                  close();
                  onRequestAdd();
                }}>
                <PlusIcon size={14} color={theme.colors.primary} />
                <Text style={styles.addButtonText}>{addLabel}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {canSearch ? (
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

          {shown.length === 0 ? (
            <Text style={styles.empty}>No matches.</Text>
          ) : (
            <ScrollView
              style={styles.optsScroll}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled">
              {shown.map(option => {
                const selected = option === value;
                return (
                  <TouchableOpacity
                    key={option}
                    style={styles.opt}
                    activeOpacity={0.7}
                    onPress={() => {
                      onChange(option);
                      close();
                    }}>
                    <Text style={styles.optLabel}>{option}</Text>
                    <View
                      style={[styles.radio, selected && styles.radioSelected]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  );
};

interface MultiProps {
  label: string;
  placeholder: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
}

/**
 * Same expanding panel, multi-select: picking toggles a checkbox and the
 * panel stays open, since design lets you keep adding without a footer.
 * The picks show as removable chips underneath the field.
 */
export const MultiDropdownField: React.FC<MultiProps> = ({
  label,
  placeholder,
  options,
  values,
  onChange,
  searchable,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const canSearch = searchable ?? options.length > SEARCH_THRESHOLD;
  const shown = filterOptions(options, query);

  const toggle = (option: string) => {
    onChange(
      values.includes(option)
        ? values.filter(v => v !== option)
        : [...values, option],
    );
  };

  return (
    <View style={styles.field}>
      <FieldLabel label={label} />
      <TouchableOpacity
        style={[styles.control, open && styles.controlOpen]}
        activeOpacity={0.85}
        onPress={() =>
          setOpen(current => {
            if (current) {
              setQuery('');
            }
            return !current;
          })
        }>
        <Text style={[styles.value, styles.placeholder]} numberOfLines={1}>
          {placeholder}
        </Text>
        <View style={open ? styles.chevOpen : undefined}>
          <ChevronDownIcon size={19} />
        </View>
      </TouchableOpacity>

      {values.length > 0 ? (
        <View style={styles.chips}>
          {values.map(item => (
            <View key={item} style={styles.chip}>
              <Text style={styles.chipText}>{item}</Text>
              <TouchableOpacity
                style={styles.chipRemove}
                activeOpacity={0.8}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                onPress={() => onChange(values.filter(v => v !== item))}>
                <XIcon size={11} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {open ? (
        <View style={styles.panel}>
          {canSearch ? (
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

          {shown.length === 0 ? (
            <Text style={styles.empty}>No matches.</Text>
          ) : (
            <ScrollView
              style={styles.optsScroll}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled">
              {shown.map(option => {
                const selected = values.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={styles.opt}
                    activeOpacity={0.7}
                    onPress={() => toggle(option)}>
                    <Text style={styles.optLabel}>{option}</Text>
                    <View style={[styles.box, selected && styles.boxChecked]}>
                      {selected ? <CheckIcon size={13} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {marginBottom: theme.spacing.lg},
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  label: {fontFamily: theme.fonts.black, fontSize: 14, color: theme.colors.text},
  required: {color: '#CF1322'},
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    height: 46,
    paddingHorizontal: 15,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: '#F4F5F7',
  },
  controlOpen: {
    borderColor: '#99D3FF',
    backgroundColor: theme.colors.white,
  },
  chevOpen: {transform: [{rotate: '180deg'}]},
  value: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.text,
  },
  placeholder: {color: theme.colors.textMuted},
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 30,
    paddingLeft: theme.spacing.md,
    paddingRight: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#99D3FF',
    backgroundColor: theme.colors.primaryLight,
  },
  chipText: {
    fontFamily: theme.fonts.black,
    fontSize: 12.5,
    color: theme.colors.primary,
  },
  chipRemove: {
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,102,178,0.16)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#99D3FF',
    backgroundColor: theme.colors.primaryLight,
  },
  addButtonText: {
    fontFamily: theme.fonts.black,
    fontSize: 12.5,
    color: theme.colors.primary,
  },
  // ---- expanding panel ----
  panel: {
    marginTop: 9,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.white,
    overflow: 'hidden',
    shadowColor: '#101828',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.09,
    shadowRadius: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 40,
    margin: 10,
    marginBottom: 4,
    paddingHorizontal: 12,
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
    padding: theme.spacing.lg,
    textAlign: 'center',
  },
  optsScroll: {maxHeight: PANEL_MAX_HEIGHT, padding: 6},
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  optLabel: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 14.5,
    color: theme.colors.text,
  },
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
  box: {
    width: 21,
    height: 21,
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
});

export default DropdownField;

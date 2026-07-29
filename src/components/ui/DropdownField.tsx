import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import SingleSelectSheet from './SingleSelectSheet';
import MultiSelectSheet from './MultiSelectSheet';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import PlusIcon from '../icons/PlusIcon';
import XIcon from '../icons/XIcon';
import {theme} from '../../theme';

/** Any list longer than this gets a filter box in its sheet. */
const SEARCH_THRESHOLD = 6;

const toOptions = (values: string[]) =>
  values.map(value => ({value, label: value}));

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
  /** Label for the sheet's create button, e.g. 'Add Fixture'. */
  addLabel?: string;
  /** Fired after the sheet has fully closed, so it may open another modal. */
  onRequestAdd?: () => void;
}

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
  const [addPending, setAddPending] = useState(false);
  const canSearch = searchable ?? options.length > SEARCH_THRESHOLD;

  return (
    <View style={styles.field}>
      <FieldLabel label={label} required={required} />
      <TouchableOpacity
        style={styles.control}
        activeOpacity={0.85}
        onPress={() => setOpen(true)}>
        <Text
          style={[styles.value, !value && styles.placeholder]}
          numberOfLines={1}>
          {value ?? placeholder}
        </Text>
        <ChevronDownIcon size={19} />
      </TouchableOpacity>

      <SingleSelectSheet
        visible={open}
        title={label}
        options={toOptions(options)}
        value={value ?? ''}
        onChange={onChange}
        onClose={() => setOpen(false)}
        searchable={canSearch}
        headerAction={
          addLabel && onRequestAdd ? (
            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.85}
              onPress={() => {
                // Held until this sheet's modal is gone — iOS drops a modal
                // presented while another is still up.
                setAddPending(true);
                setOpen(false);
              }}>
              <PlusIcon size={14} color={theme.colors.primary} />
              <Text style={styles.addButtonText}>{addLabel}</Text>
            </TouchableOpacity>
          ) : undefined
        }
        onClosed={() => {
          if (addPending) {
            setAddPending(false);
            onRequestAdd?.();
          }
        }}
      />
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

/** Same field, multi-select: the picks show as removable chips underneath. */
export const MultiDropdownField: React.FC<MultiProps> = ({
  label,
  placeholder,
  options,
  values,
  onChange,
  searchable,
}) => {
  const [open, setOpen] = useState(false);
  const canSearch = searchable ?? options.length > SEARCH_THRESHOLD;

  return (
    <View style={styles.field}>
      <FieldLabel label={label} />
      <TouchableOpacity
        style={styles.control}
        activeOpacity={0.85}
        onPress={() => setOpen(true)}>
        <Text style={[styles.value, styles.placeholder]} numberOfLines={1}>
          {placeholder}
        </Text>
        <ChevronDownIcon size={19} />
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

      <MultiSelectSheet
        visible={open}
        title={label}
        options={toOptions(options)}
        value={values}
        onApply={onChange}
        onClose={() => setOpen(false)}
        searchable={canSearch}
      />
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
});

export default DropdownField;

import React from 'react';
import {View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import TextField from './TextField';
import {SearchIcon, SortIcon} from '../icons';
import {theme} from '../../theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  /** Tints the sort button while the sort sheet is up. */
  sortOpen: boolean;
  onOpenSort: () => void;
  /** Dispatch searches by case number; the default suits ID-or-name lists. */
  placeholder?: string;
  /** Work adds a top margin because the tab switcher sits above it. */
  style?: StyleProp<ViewStyle>;
}

const ListSearchRow: React.FC<Props> = ({
  value,
  onChangeText,
  sortOpen,
  onOpenSort,
  placeholder = 'Search by ID or name',
  style,
}) => (
  <View style={[styles.row, style]}>
    <TextField
      containerStyle={styles.field}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="search"
      leadingIcon={<SearchIcon size={20} />}
    />

    <TouchableOpacity
      style={[styles.button, sortOpen && styles.buttonActive]}
      activeOpacity={0.8}
      onPress={onOpenSort}>
      <SortIcon size={20} color={sortOpen ? theme.colors.primary : '#475467'} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  field: {flex: 1},
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
});

export default ListSearchRow;

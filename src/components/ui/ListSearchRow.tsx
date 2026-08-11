import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
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
      wrapStyle={styles.fieldWrap}
      style={styles.fieldInput}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="search"
      leadingIcon={<SearchIcon size={19} />}
    />

    <TouchableOpacity
      style={[styles.button, sortOpen && styles.buttonActive]}
      activeOpacity={0.8}
      onPress={onOpenSort}>
      <SortIcon size={22} color={sortOpen ? theme.colors.primary : '#475467'} />
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
  fieldWrap: {
    height: 42,
    borderRadius: theme.radius.glassPill,
    borderColor: theme.glass.pillBorder,
    backgroundColor: theme.glass.pillFill,
    paddingHorizontal: 13,
    ...theme.shadow.glassPill,
  },
  // The wrap is a fixed 42 now, so the input can't own the row's height —
  // drop TextField's own vertical padding and let it centre instead.
  fieldInput: {paddingVertical: 0, fontSize: 15},
  button: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.glassPill,
    borderWidth: 1,
    borderColor: theme.glass.pillBorder,
    backgroundColor: theme.glass.pillFill,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.glassPill,
  },
  buttonActive: {
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.colors.accentTint,
  },
});

export default ListSearchRow;

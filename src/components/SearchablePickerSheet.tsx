import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import BottomSheet from './BottomSheet';
import {theme} from '../theme';

export interface PickerOption {
  id: string | number;
  label: string;
}

interface Props {
  visible: boolean;
  title: string;
  options: PickerOption[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  onSelect: (option: PickerOption) => void;
  onClose: () => void;
}

const SearchablePickerSheet: React.FC<Props> = ({
  visible,
  title,
  options,
  isLoading = false,
  searchPlaceholder = 'Search...',
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(option => option.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <BottomSheet visible={visible} onClose={onClose} sheetStyle={{maxHeight: '70%'}}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity testID="picker-sheet-close" onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          testID="picker-sheet-search"
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={theme.colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primaryDark} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results</Text>
            </View>
          ) : (
            filtered.map(item => (
              <TouchableOpacity
                key={item.id}
                testID={`picker-sheet-option-${item.id}`}
                onPress={() => onSelect(item)}
                style={styles.listItem}
                activeOpacity={0.7}>
                <Text style={styles.listItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {fontSize: theme.fontSize.md, fontFamily: theme.fonts.bold, color: theme.colors.text},
  closeBtn: {padding: theme.spacing.xs},
  closeText: {fontSize: 18, fontFamily: theme.fonts.bold, color: theme.colors.textMuted},
  searchWrap: {paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.md},
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  loadingContainer: {padding: 40, alignItems: 'center'},
  listContent: {padding: theme.spacing.md},
  listItem: {
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: '#F7F9FC',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listItemText: {fontSize: theme.fontSize.base, fontFamily: theme.fonts.medium, color: theme.colors.text},
  emptyContainer: {padding: 32, alignItems: 'center'},
  emptyText: {fontFamily: theme.fonts.regular, color: theme.colors.textMuted, fontSize: theme.fontSize.xs + 2},
});

export default SearchablePickerSheet;

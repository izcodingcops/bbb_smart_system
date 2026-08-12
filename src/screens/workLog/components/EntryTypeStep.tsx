import React, {useState} from 'react';
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import ScreenBackground from '../../../components/ScreenBackground';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowRightIcon, CheckIcon, SearchIcon, XIcon} from '../../../components/icons';
import {ENTRY_TYPES} from '../../../types/workLog';
import {theme} from '../../../theme';
import {workLogCopy} from '../shiftText';

interface Props {
  shiftTypeName: string;
  selected: string | null;
  onSelect: (name: string) => void;
  onNext: () => void;
  onCancel: () => void;
}

/** Step 1 of 2 — pick one Entry Type from a search-filterable chip grid. */
const EntryTypeStep: React.FC<Props> = ({
  shiftTypeName,
  selected,
  onSelect,
  onNext,
  onCancel,
}) => {
  const [query, setQuery] = useState('');
  const title = workLogCopy(shiftTypeName).createTitle;

  const visible = ENTRY_TYPES.filter(name =>
    name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.topbar}>
        <View style={styles.topbarRow}>
          <TouchableOpacity
            style={styles.topbarButton}
            activeOpacity={0.8}
            onPress={onCancel}>
            <XIcon size={19} color="#3A3F46" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
        </View>
      </SafeAreaView>

      <View style={styles.stepper}>
        <Text style={styles.stepLabel}>
          Step <Text style={styles.stepLabelBold}>01</Text> / 02
        </Text>
        <View style={styles.track}>
          <View style={[styles.trackFill, {width: '50%'}]} />
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Entry Types</Text>
        <Text style={styles.sectionSub}>
          Choose the entry type that matches the situation, then fill out its
          form.
        </Text>

        <View style={styles.search}>
          <SearchIcon size={18} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name…"
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
        </View>

        {visible.length === 0 ? (
          <Text style={styles.empty}>No entry types match your search.</Text>
        ) : (
          <FlatList
            data={visible}
            keyExtractor={item => item}
            numColumns={2}
            columnWrapperStyle={styles.chipRow}
            contentContainerStyle={styles.chipList}
            renderItem={({item}) => {
              const active = item === selected;
              return (
                <TouchableOpacity
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.85}
                  onPress={() => onSelect(active ? '' : item)}>
                  {active ? (
                    <CheckIcon size={15} color={theme.colors.primary} />
                  ) : null}
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                    numberOfLines={1}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity
          style={[styles.next, !selected && styles.nextDisabled]}
          activeOpacity={0.9}
          disabled={!selected}
          onPress={onNext}>
          <Text style={styles.nextText}>Next</Text>
          <ArrowRightIcon size={18} color={theme.colors.white} />
        </TouchableOpacity>
      </SafeAreaView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  topbar: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  topbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: theme.spacing.xs,
  },
  topbarButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F1F4',
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    letterSpacing: -0.6,
    color: theme.colors.text,
  },
  stepper: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  stepLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  stepLabelBold: {fontFamily: theme.fonts.black, color: theme.colors.text},
  track: {height: 6, borderRadius: 99, backgroundColor: '#E7E9ED', overflow: 'hidden'},
  trackFill: {height: '100%', borderRadius: 99, backgroundColor: theme.colors.primary},
  body: {flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md},
  sectionTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 21,
    letterSpacing: -0.3,
    color: theme.colors.text,
    marginBottom: 5,
  },
  sectionSub: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: theme.colors.textSecondary,
    lineHeight: 19,
    marginBottom: theme.spacing.lg,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.lg,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.text,
  },
  empty: {
    textAlign: 'center',
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.textMuted,
    paddingTop: 40,
  },
  chipList: {paddingBottom: 20},
  chipRow: {gap: 10, marginBottom: 10},
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  chipText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.textSecondary,
    flexShrink: 1,
  },
  chipTextActive: {fontFamily: theme.fonts.black, color: theme.colors.primary},
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    backgroundColor: theme.colors.white,
  },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    marginBottom: 13,
  },
  nextDisabled: {opacity: 0.45},
  nextText: {
    fontFamily: theme.fonts.black,
    fontSize: 17,
    letterSpacing: 0.2,
    color: theme.colors.white,
  },
});

export default EntryTypeStep;

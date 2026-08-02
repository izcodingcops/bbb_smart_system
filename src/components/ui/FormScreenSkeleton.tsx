import React from 'react';
import {
  DimensionValue,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {XIcon} from '../icons';
import Skeleton from './Skeleton';
import {theme} from '../../theme';

/**
 * Cycled by row index so rows don't all read as one photocopied shape — a
 * short label over a full-width input, over and over. Widths are illustrative
 * (not tied to real field types), just varied enough to look like a form.
 */
const ROW_VARIANTS: {labelWidth: number; inputWidth: DimensionValue}[] = [
  {labelWidth: 90, inputWidth: '100%'},
  {labelWidth: 70, inputWidth: '62%'},
  {labelWidth: 110, inputWidth: '100%'},
  {labelWidth: 60, inputWidth: '45%'},
];

interface Props {
  /** Screen title — already known before the form options load, so it's shown for real rather than as a bone. */
  title: string;
  onClose: () => void;
  /** Number of generic label+input rows to show per section card, in order. */
  sectionRowCounts: number[];
}

/**
 * Loading placeholder shaped like MaintenanceForm/FixtureForm — a real topbar
 * (its title and close button don't depend on the options that are loading),
 * section cards holding generic field rows, and a footer submit button.
 */
const FormScreenSkeleton: React.FC<Props> = ({title, onClose, sectionRowCounts}) => (
  <View style={styles.root}>
    <SafeAreaView edges={['top']} style={styles.topbar}>
      <View style={styles.topbarRow}>
        <TouchableOpacity style={styles.topbarButton} activeOpacity={0.8} onPress={onClose}>
          <XIcon size={19} color="#3A3F46" />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>
    </SafeAreaView>

    <ScrollView
      style={styles.body}
      contentContainerStyle={styles.bodyContent}
      showsVerticalScrollIndicator={false}>
      {sectionRowCounts.map((rowCount, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Skeleton width={140} height={18} style={styles.sectionTitle} />
          {Array.from({length: rowCount}).map((_, rowIndex) => {
            const variant = ROW_VARIANTS[rowIndex % ROW_VARIANTS.length];
            return (
              <View key={rowIndex} style={styles.field}>
                <Skeleton width={variant.labelWidth} height={11} />
                <Skeleton width={variant.inputWidth} height={46} radius={12} />
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>

    <SafeAreaView edges={['bottom']} style={styles.footer}>
      <Skeleton width="100%" height={54} radius={15} />
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
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
  body: {flex: 1},
  bodyContent: {paddingBottom: 40},
  section: {
    marginHorizontal: theme.spacing.lg,
    marginTop: 14,
    padding: theme.spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    ...theme.shadow.card,
  },
  sectionTitle: {marginBottom: 14},
  field: {marginBottom: theme.spacing.lg, gap: 6},
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    backgroundColor: theme.colors.white,
  },
});

export default FormScreenSkeleton;

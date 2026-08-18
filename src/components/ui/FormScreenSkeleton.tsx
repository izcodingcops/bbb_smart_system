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
import ScreenBackground from '../ScreenBackground';
import {XIcon} from '../icons';
import Skeleton from './Skeleton';
import {formChrome} from './formChrome';
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
 *
 * Shares `formChrome` (rather than its own flat-white approximation) for the
 * topbar/section/footer fills so the glass chrome doesn't visibly swap in
 * once the form options finish loading and the real form mounts.
 */
const FormScreenSkeleton: React.FC<Props> = ({title, onClose, sectionRowCounts}) => (
  <ScreenBackground style={formChrome.root}>
    <SafeAreaView edges={['top']} style={formChrome.topbar}>
      <View style={styles.topbarRow}>
        <TouchableOpacity style={formChrome.topbarButton} activeOpacity={0.8} onPress={onClose}>
          <XIcon size={19} color="#3A3F46" />
        </TouchableOpacity>
        <Text style={formChrome.title}>{title}</Text>
      </View>
    </SafeAreaView>

    <ScrollView
      style={formChrome.body}
      contentContainerStyle={formChrome.bodyContent}
      showsVerticalScrollIndicator={false}>
      {sectionRowCounts.map((rowCount, sectionIndex) => (
        <View key={sectionIndex} style={formChrome.section}>
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

    <SafeAreaView edges={['bottom']} style={formChrome.footer}>
      <Skeleton width="100%" height={54} radius={15} />
    </SafeAreaView>
  </ScreenBackground>
);

const styles = StyleSheet.create({
  topbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: theme.spacing.xs,
  },
  sectionTitle: {marginBottom: 14},
  field: {marginBottom: theme.spacing.lg, gap: 6},
});

export default FormScreenSkeleton;

import {StyleSheet} from 'react-native';
import {theme} from '../../theme';

/**
 * The two style keys every equipment form screen holds beyond the shared
 * `formChrome` in components/ui: the wrapper around the summary card that
 * sits under the topbar, and the bold run inside the submit dialog's message.
 * Both were byte-identical copies in Check-Out, Check-In and Add Upkeep.
 *
 * Anything genuinely local to one form stays in that form's own StyleSheet —
 * this is only for what all of them share.
 */
export const equipmentFormChrome = StyleSheet.create({
  summaryWrap: {marginHorizontal: theme.spacing.lg, marginTop: 14},
  bold: {fontFamily: theme.fonts.black},
});

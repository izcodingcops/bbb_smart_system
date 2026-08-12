import {StyleSheet} from 'react-native';
import {theme} from '../../theme';

/**
 * The chrome every create/edit form shares: topbar, section card, address box,
 * footer and submit button. Extracted from FixtureForm and MaintenanceForm,
 * which held byte-identical copies, so a third form does not become a third
 * copy. A form's own field-level styles stay local to it.
 */
export const formChrome = StyleSheet.create({
  // No fill of its own — every form roots in a <ScreenBackground>, so the page
  // gradient runs the full height behind the cards and the footer.
  root: {flex: 1},
  // Transparent, matching DetailTopBar: no white header band, no rule under it.
  topbar: {backgroundColor: 'transparent'},
  topbarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: theme.spacing.xs,
  },
  topbarButton: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.glassPill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.glass.pillBorder,
    backgroundColor: theme.glass.buttonFill,
    ...theme.shadow.glassPill,
  },
  topbarText: {flex: 1, minWidth: 0},
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    letterSpacing: -0.6,
    color: theme.colors.text,
  },
  reference: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  bodyWrap: {flex: 1},
  body: {flex: 1},
  bodyContent: {paddingBottom: 40},
  // Same glass card as RecordCard — inset and rounded, unlike the detail
  // screen's full-bleed bands. See Card.tsx for why the ramp is drawn with
  // experimental_backgroundImage rather than a LinearGradient view.
  section: {
    marginHorizontal: theme.spacing.lg,
    marginTop: 14,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
    borderRadius: theme.radius.glass,
    borderWidth: 1,
    borderColor: theme.glass.cardBorder,
    backgroundColor: theme.glass.cardFillFlat,
    experimental_backgroundImage: theme.glass.cardFillGradient,
    ...theme.shadow.glass,
  },
  sectionTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 18,
    letterSpacing: -0.2,
    color: theme.colors.text,
    marginBottom: 14,
  },
  field: {marginBottom: theme.spacing.lg},
  lastField: {marginBottom: 6},
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.md,
  },
  changeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
  },
  changeLocationText: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.primary,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: 14,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: '#F4F5F7',
  },
  addressText: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 14.5,
    lineHeight: 20,
    color: theme.colors.text,
  },
  // Mirrors the tab bar: pill-shaped top, glass fill, shadow pointing up so it
  // lifts off the content scrolling beneath it.
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 13,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: theme.glass.navBorder,
    backgroundColor: theme.glass.navFill,
    boxShadow: '0px -6px 24px 0px rgba(16,24,40,0.10)',
  },
  submit: {
    height: 54,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginBottom: 13,
  },
  submitDisabled: {opacity: 0.45},
  submitText: {
    fontFamily: theme.fonts.black,
    fontSize: 16,
    letterSpacing: 0.2,
    color: theme.colors.white,
  },
});

import {fontFamilies} from '../constants/fonts';

export const theme = {
  colors: {
    primary: '#0066B2',
    primaryDark: '#1D4889',
    primaryLight: '#EFF6FF',
    background: '#F3F4F6',
    surface: '#FFFFFF',
    border: '#EAEDF0',
    borderLight: '#EBEBEB',
    text: '#1A1A1A',
    textSecondary: '#667085',
    textMuted: '#9CA3AF',
    white: '#FFFFFF',
    whiteMuted: 'rgba(255,255,255,0.8)',
    whiteSubtle: 'rgba(255,255,255,0.3)',
    whiteGhost: 'rgba(255,255,255,0.2)',
    error: '#EF4444',
    /** Fill behind a field in its error state. */
    errorLight: '#FEF3F2',
    success: '#16A34A',
    info: '#3B82F6',
    overlay: 'rgba(0,0,0,0.4)',
    primaryAlpha: 'rgba(0,102,178,0.08)',
    divider: '#DEDEDE',
    textLight: '#ECECEC',
    textDark: '#3B3B3B',
    textLabel: '#656565',
    toastBg: '#1F2937',
    /* --- Glass design language (Figma 6841-126935) ------------------------
     * The glass surfaces sit on a tinted gradient rather than flat gray, so
     * they need their own slightly cooler/darker text ramp — the old
     * text/textMuted pair washes out against a translucent fill. */
    /** Card values and other primary text on glass. */
    textOnGlass: '#20242A',
    /** Field labels / meta text on glass. */
    textOnGlassMuted: '#8B9099',
    /** Secondary heading text on glass (e.g. a record's type). */
    textOnGlassSubtle: '#5B5F66',
    /** Hairline divider inside a glass card. */
    dividerOnGlass: '#EEF0F2',
    /** Selected-state tint used by the tab bar tile and the Back-to-top pill. */
    accentTint: '#E6F4FF',
    accentBorder: '#99D3FF',
  },
  fonts: {
    light: fontFamilies.LATO.light,
    regular: fontFamilies.LATO.regular,
    medium: fontFamilies.LATO.medium,
    bold: fontFamilies.LATO.bold,
    black: fontFamilies.LATO.black,
  },
  fontSize: {
    xs: 12,
    sm: 13,
    base: 15,
    md: 16,
    lg: 20,
    xl: 22,
    xxl: 24,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 14,
    xl: 20,
    /** Glass card corner. */
    glass: 20,
    /** Glass field / square button corner (search row, sort button). */
    glassPill: 13,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  shadow: {
    card: {
      shadowColor: '#101828',
      shadowOffset: {width: 1, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    button: {
      shadowColor: '#00467A',
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 1,
      shadowRadius: 7,
      elevation: 4,
    },
    fab: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    /* --- Glass shadows ----------------------------------------------------
     * The design layers two shadows on every glass surface — a 1px contact
     * shadow plus a wide ambient one. RN's shadowColor/Offset/Radius trio can
     * only express one, so these use `boxShadow` (RN 0.76+ / New Arch, both
     * platforms), which takes a comma-separated list like CSS. Don't mix the
     * two APIs on the same view — set `boxShadow` alone. */
    glass: {
      boxShadow:
        '0px 1px 2px 0px rgba(16,24,40,0.05), 0px 6px 18px 0px rgba(16,24,40,0.05)',
    },
    /** Same list as `glass` — search field, sort button and filter chips all
     *  share the card's elevation in the design. */
    glassPill: {
      boxShadow:
        '0px 1px 2px 0px rgba(16,24,40,0.05), 0px 6px 18px 0px rgba(16,24,40,0.05)',
    },
    /** Tab bar — heavier, since it floats over scrolling content. */
    nav: {
      boxShadow:
        '0px 2px 6px 0px rgba(16,24,40,0.08), 0px 10px 30px 0px rgba(16,24,40,0.14)',
    },
    /** FAB — tinted toward the brand blue rather than neutral black. */
    fabGlass: {boxShadow: '0px 10px 30px 0px rgba(0,60,110,0.28)'},
    backToTop: {
      boxShadow:
        '0px 2px 6px 0px rgba(16,24,40,0.06), 0px 14px 34px 0px rgba(16,24,40,0.09)',
    },
  },
  /**
   * Translucent fills for the glass surfaces. These are *fake* glass: RN has no
   * `backdrop-filter`, so the design's BACKGROUND_BLUR (10–22px) is dropped and
   * only the translucent fill + light border + layered shadow survive. Reads
   * correctly over `ScreenBackground`'s gradient; would need
   * `@react-native-community/blur` to become true frosted glass.
   */
  glass: {
    /**
     * Card fill is a vertical ramp, not a flat color. Drawn by RN itself via
     * `experimental_backgroundImage` rather than react-native-linear-gradient:
     * that library ships no Fabric spec, so on the New Architecture it renders
     * through the legacy interop layer, which doesn't size a gradient view from
     * its children — the card's content ends up clipped on the right and
     * bottom. Fixed-size gradients (the FAB) are unaffected.
     */
    cardFillGradient:
      'linear-gradient(to bottom, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.5) 100%)',
    /**
     * Flat midpoint of `cardFillGradient`, painted underneath it. The gradient
     * prop is still `experimental_`-prefixed, so this is what the card falls
     * back to if it ever no-ops instead of leaving a transparent panel.
     */
    cardFillFlat: 'rgba(255,255,255,0.62)',
    cardBorder: 'rgba(255,255,255,0.75)',
    /** Search field / sort button. */
    pillFill: 'rgba(255,255,255,0.55)',
    /** Filter chips sit one step more transparent than the fields. */
    chipFill: 'rgba(255,255,255,0.5)',
    pillBorder: 'rgba(255,255,255,0.7)',
    /**
     * Full-bleed fill behind a detail screen's sections.
     *
     * Currently transparent, under evaluation: the translucent white sheet this
     * used to be (`rgba(255,255,255,0.5)`) was inferred from a screenshot, not
     * read from the design, and it washed out the middle of the screen. With it
     * off, all the tonal banding comes from the page gradient alone. Flip it
     * back to a translucent white if the sections turn out to be filled.
     */
    sheetFill: 'transparent',
    /**
     * Chrome buttons — back, Edit, Add comment, the Work tab switcher's active
     * tab. A touch brighter than `pillFill` so they still read as raised
     * controls, but translucent enough that the gradient shows through: at 0.9
     * they rendered as flat opaque white and broke the glass effect.
     */
    buttonFill: 'rgba(255,255,255,0.6)',
    navFill: 'rgba(255,255,255,0.72)',
    navBorder: 'rgba(255,255,255,0.8)',
    /**
     * What sits behind the translucent tab bar. The bar takes layout space
     * below the scene rather than floating over it, so `ScreenBackground`'s
     * gradient stops short of it — this is that gradient's final stop, so the
     * bar's translucency resolves against the tone the design put there.
     */
    navBackdrop: '#EDF4EC',
  },
  common: {
    row: {flexDirection: 'row' as const, alignItems: 'center' as const},
    center: {alignItems: 'center' as const, justifyContent: 'center' as const},
    flex1: {flex: 1},
  },
  gradients: {
    maintenanceHeader: ['#d4e1ee', '#d7ebe04b'] as [string, string],
    /** FAB — the design's 145°-ish blue ramp. */
    fab: ['#0092FF', '#0066B2'] as [string, string],
    /**
     * App background, transcribed from the Figma frame's three stacked fills.
     * A vertical base ramp (cool blue at the top, faintly green at the bottom)
     * plus two elliptical washes. The wash centres/radii are fractions of the
     * screen's width/height, so they scale instead of being pinned to the
     * 392pt design frame.
     */
    screen: {
      base: [
        {offset: 0, color: '#E2E9F2'},
        {offset: 0.07, color: '#E4ECF3'},
        {offset: 0.2, color: '#EFF3F6'},
        {offset: 0.34, color: '#F5F6F8'},
        {offset: 0.55, color: '#F4F5F7'},
        {offset: 0.7, color: '#F2F5F4'},
        {offset: 0.84, color: '#EFF4EE'},
        {offset: 1, color: '#EDF4EC'},
      ],
      /** Rises from just below the bottom edge. */
      greenWash: {
        cx: 0.4,
        cy: 1.03,
        rx: 0.96,
        ry: 0.3,
        stops: [
          {offset: 0, color: '#E8F4E4', opacity: 0.5},
          {offset: 0.52, color: '#EAF5E6', opacity: 0.25},
          {offset: 0.84, color: '#EAF5E6', opacity: 0},
        ],
      },
      /** Centred off the right edge at mid-height. */
      blueWash: {
        cx: 1.04,
        cy: 0.4,
        rx: 0.78,
        ry: 0.44,
        stops: [
          {offset: 0, color: '#D2E0F0', opacity: 0.55},
          {offset: 0.42, color: '#D4E1F0', opacity: 0.3},
          {offset: 0.74, color: '#D4E1F0', opacity: 0},
        ],
      },
    },
  },
} as const;

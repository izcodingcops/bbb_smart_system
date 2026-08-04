import React, {forwardRef, useImperativeHandle, useState} from 'react';
import {
  LayoutChangeEvent,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import {theme} from '../../theme';

interface Props {
  title: string;
  /** Second line under the title — e.g. an incident's 'Incident 1' label. */
  subtitle?: string;
  initiallyOpen?: boolean;
  /** Draws the card's border in the accent colour — e.g. a just-added record. */
  highlighted?: boolean;
  children: React.ReactNode;
  /** Forwarded to the root card — lets a parent measure its scroll offset. */
  onLayout?: (event: LayoutChangeEvent) => void;
}

/** Imperative handle for parents that need to force a section open, e.g. jumping here from a section tab. */
export interface AccordionSectionHandle {
  open: () => void;
}

/**
 * White section card whose body collapses. Rendering is conditional rather
 * than height-animated: the bodies hold dropdowns and text inputs, and keeping
 * them mounted-but-clipped leaves their sheets reachable while collapsed.
 */
const AccordionSection = forwardRef<AccordionSectionHandle, Props>(
  ({title, subtitle, initiallyOpen = false, highlighted, children, onLayout}, ref) => {
    const [open, setOpen] = useState(initiallyOpen);

    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
    }));

    return (
      <View style={[styles.card, highlighted && styles.cardHighlighted]} onLayout={onLayout}>
        <TouchableOpacity
          style={styles.header}
          activeOpacity={0.8}
          onPress={() => setOpen(current => !current)}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <View style={open ? undefined : styles.chevronClosed}>
            <ChevronDownIcon size={22} color={theme.colors.textSecondary} />
          </View>
        </TouchableOpacity>
        {open ? <View style={styles.body}>{children}</View> : null}
      </View>
    );
  },
);

AccordionSection.displayName = 'AccordionSection';

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.lg,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  cardHighlighted: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 18,
    letterSpacing: -0.2,
    color: theme.colors.text,
  },
  headerText: {flex: 1, minWidth: 0},
  subtitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  chevronClosed: {transform: [{rotate: '-90deg'}]},
  body: {paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xs},
});

export default AccordionSection;

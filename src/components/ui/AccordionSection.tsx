import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import {theme} from '../../theme';

interface Props {
  title: string;
  /** Second line under the title — e.g. an incident's 'Incident 1' label. */
  subtitle?: string;
  initiallyOpen?: boolean;
  children: React.ReactNode;
}

/**
 * White section card whose body collapses. Rendering is conditional rather
 * than height-animated: the bodies hold dropdowns and text inputs, and keeping
 * them mounted-but-clipped leaves their sheets reachable while collapsed.
 */
const AccordionSection: React.FC<Props> = ({
  title,
  subtitle,
  initiallyOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <View style={styles.card}>
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
};

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

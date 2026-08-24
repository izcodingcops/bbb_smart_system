import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Card} from '../../../components/ui';
import {theme} from '../../../theme';

interface Props {
  title: string;
  children: React.ReactNode;
}

const ProfileSectionCard: React.FC<Props> = ({title, children}) => (
  <View style={styles.wrap}>
    <Text style={styles.title}>{title}</Text>
    <Card glass style={styles.card}>
      {children}
    </Card>
  </View>
);

const styles = StyleSheet.create({
  wrap: {marginBottom: theme.spacing.lg},
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: theme.colors.textOnGlassMuted,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  card: {paddingVertical: theme.spacing.xs},
});

export default ProfileSectionCard;

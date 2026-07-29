import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import PrimaryButton from './PrimaryButton';
import {theme} from '../../theme';

interface Props {
  /** Caller renders its own icon, e.g. `<ToolsIcon size={28} color={theme.colors.primary} />`. */
  icon: React.ReactNode;
  title: string;
  body: string;
  /** Omitted when there's nothing useful to do — e.g. no records exist at all. */
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<Props> = ({icon, title, body, actionLabel, onAction}) => (
  <View style={styles.root}>
    <View style={styles.iconTile}>{icon}</View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.body}>{body}</Text>
    {actionLabel && onAction ? (
      <PrimaryButton
        label={actionLabel}
        onPress={onAction}
        style={styles.action}
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: 56,
  },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 18,
    color: '#181B1F',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  body: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  action: {marginTop: theme.spacing.xl, paddingHorizontal: theme.spacing.xxl},
});

export default EmptyState;

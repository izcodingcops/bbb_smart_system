import React, {useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import CheckIcon from '../icons/CheckIcon';
import TrashIcon from '../icons/TrashIcon';
import {theme} from '../../theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  /** Trailing button — omit for a toast with nothing to act on. */
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  variant?: 'success' | 'danger';
}

const AUTO_DISMISS_MS = 6000;

/**
 * Drops in from under the status bar and retreats on its own. `onDismiss` is
 * read through a ref so a parent re-render doesn't restart the timer.
 */
const Toast: React.FC<Props> = ({
  visible,
  title,
  message,
  actionLabel,
  onAction,
  onDismiss,
  variant = 'success',
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 320 : 200,
      useNativeDriver: true,
    }).start();

    if (!visible) {
      return;
    }
    const timer = setTimeout(() => onDismissRef.current(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const danger = variant === 'danger';

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.wrap,
        {
          top: insets.top + theme.spacing.sm,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-120, 0],
              }),
            },
          ],
        },
      ]}>
      <View style={[styles.card, danger && styles.cardDanger]}>
        <View style={[styles.badge, danger && styles.badgeDanger]}>
          {danger ? (
            <TrashIcon size={20} color={theme.colors.white} />
          ) : (
            <CheckIcon size={20} color={theme.colors.white} />
          )}
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        {actionLabel && onAction ? (
          <TouchableOpacity
            style={[styles.action, danger && styles.actionDanger]}
            activeOpacity={0.85}
            onPress={onAction}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 60,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#B7EB8F',
    backgroundColor: theme.colors.white,
    shadowColor: '#102818',
    shadowOffset: {width: 0, height: 14},
    shadowOpacity: 0.18,
    shadowRadius: 34,
    elevation: 8,
  },
  cardDanger: {borderColor: '#FFCCC7'},
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDanger: {backgroundColor: '#CF1322'},
  text: {flex: 1},
  title: {fontFamily: theme.fonts.black, fontSize: 14.5, color: '#181B1F'},
  message: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  action: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.success,
  },
  actionDanger: {backgroundColor: '#CF1322'},
  actionText: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.white,
  },
});

export default Toast;

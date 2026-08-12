import React, {useEffect, useRef, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {theme} from '../../theme';

/** The `tinted` sheet fill — exported so content inside can match it exactly
 *  (e.g. AssigneeSheet's cards) instead of layering another fill on top. */
export const SHEET_TINT = '#F5F7FA';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  /**
   * Fired once the native modal is really gone. iOS can only present one modal
   * at a time, so anything that opens another one on the sheet's way out has to
   * wait for this rather than firing alongside onClose.
   */
  onClosed?: () => void;
  children: React.ReactNode;
  /** Rendered below the scrollable body, pinned with a top divider — for a
   *  primary action that should stay visible while the content scrolls. */
  footer?: React.ReactNode;
  /** A faint tint instead of flat white, so glass-fill content inside (e.g.
   *  AssigneeSheet's translucent cards) reads against something other than
   *  white-on-white. Default false keeps every other sheet unchanged. */
  tinted?: boolean;
}

/**
 * Sheet shell: the scrim fades in place while only the sheet slides up.
 * Mount is held until the exit animation finishes, otherwise the Modal would
 * unmount mid-slide and the sheet would vanish instead of retreating.
 */
const BottomSheet: React.FC<Props> = ({
  visible,
  title,
  onClose,
  onClosed,
  children,
  footer,
  tinted = false,
}) => {
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(400);
  // Floors the sheet to the tallest height it's reached this time it's open, so
  // content that shrinks in place (e.g. a search filter narrowing the list)
  // doesn't visibly collapse the sheet while it's up.
  const maxHeightSeen = useRef(0);
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const {height: windowHeight} = useWindowDimensions();

  // Read through a ref: the effect below deliberately only tracks `visible`,
  // so capturing the prop directly would strand an old callback.
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      maxHeightSeen.current = 0;
      Animated.timing(anim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished) {
          setMounted(false);
          // iOS waits for the Modal's onDismiss instead — dismissal is still
          // in flight here, and presenting anything now would be dropped.
          if (Platform.OS !== 'ios') {
            onClosedRef.current?.();
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight, 0],
  });

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
      onDismiss={
        Platform.OS === 'ios' ? () => onClosedRef.current?.() : undefined
      }>
      <View style={styles.fill}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, {opacity: anim}]} />
        </TouchableWithoutFeedback>

        <Animated.View
          onLayout={e => {
            const height = e.nativeEvent.layout.height;
            setSheetHeight(height);
            if (height > maxHeightSeen.current) {
              maxHeightSeen.current = height;
            }
          }}
          style={[
            styles.sheet,
            tinted && styles.sheetTinted,
            {
              maxHeight: windowHeight * 0.8,
              minHeight: maxHeightSeen.current,
              transform: [{translateY}],
            },
          ]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.close}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              {
                paddingBottom: footer
                  ? theme.spacing.lg
                  : Math.max(insets.bottom, theme.spacing.xxl),
              },
            ]}
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>

          {footer ? (
            <View
              style={[
                styles.footer,
                {paddingBottom: Math.max(insets.bottom, theme.spacing.lg)},
              ]}>
              {footer}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fill: {flex: 1, justifyContent: 'flex-end'},
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlay,
  },
  sheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetTinted: {backgroundColor: SHEET_TINT},
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D7DBE0',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  header: {
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 17,
    color: '#181B1F',
    textAlign: 'center',
  },
  close: {
    position: 'absolute',
    right: theme.spacing.lg,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  scroll: {paddingHorizontal: theme.spacing.lg},
  footer: {
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});

export default BottomSheet;

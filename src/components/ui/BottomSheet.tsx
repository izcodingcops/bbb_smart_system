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
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {theme} from '../../theme';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Sheet shell: the scrim fades in place while only the sheet slides up.
 * Mount is held until the exit animation finishes, otherwise the Modal would
 * unmount mid-slide and the sheet would vanish instead of retreating.
 */
const BottomSheet: React.FC<Props> = ({visible, title, onClose, children}) => {
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(400);
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const {height: windowHeight} = useWindowDimensions();

  useEffect(() => {
    if (visible) {
      setMounted(true);
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
      onRequestClose={onClose}>
      <View style={styles.fill}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, {opacity: anim}]} />
        </TouchableWithoutFeedback>

        <Animated.View
          onLayout={e => setSheetHeight(e.nativeEvent.layout.height)}
          style={[
            styles.sheet,
            {maxHeight: windowHeight * 0.8, transform: [{translateY}]},
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
              {paddingBottom: Math.max(insets.bottom, theme.spacing.xxl)},
            ]}
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
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
});

export default BottomSheet;

import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Animated,
  Easing,
  Pressable,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Extra style for the white sheet (e.g. {maxHeight: '70%'}). */
  sheetStyle?: ViewStyle;
}

const BottomSheet: React.FC<Props> = ({
  visible,
  onClose,
  children,
  sheetStyle,
}) => {
  const insets = useSafeAreaInsets();
  // Stay mounted through the exit animation; fade the backdrop and slide the
  // sheet separately so the dim layer never slides up the screen.
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  const progress = useRef(new Animated.Value(0)).current; // 0 = closed, 1 = open

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => finished && setMounted(false));
    }
  }, [visible, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight || 1000, 0], // measured height; safe fallback
  });

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1">
        {/* Dim backdrop — fades in place. */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            opacity: progress,
          }}
        />
        {/* Spacer above the sheet — fills the gap and dismisses on tap. */}
        <Pressable className="flex-1" onPress={onClose} />
        {/* Sheet — measured for the slide; pinned to the bottom by the spacer. */}
        <Animated.View
          onLayout={e => setSheetHeight(e.nativeEvent.layout.height)}
          className="bg-white rounded-tl-[20px] rounded-tr-[20px]"
          style={[
            { paddingBottom: insets.bottom, transform: [{ translateY }] },
            sheetStyle,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default BottomSheet;

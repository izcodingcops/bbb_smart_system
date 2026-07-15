import React, {useEffect, useRef, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {theme} from '../theme';

interface Props {
  visible: boolean;
  value: Date;
  title?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

/**
 * Time picker presented as a bottom sheet on iOS: the scrim fades in place
 * while only the sheet slides up (committed on "Done"). Android has no
 * embeddable picker, so it uses the platform's native time dialog and reports
 * the result through the same callbacks.
 */
const TimePickerSheet: React.FC<Props> = ({
  visible,
  value,
  title = 'Select time',
  minimumDate,
  maximumDate,
  onConfirm,
  onCancel,
}) => {
  const [temp, setTemp] = useState<Date>(value);
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(320);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setTemp(value);
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

  if (Platform.OS === 'android') {
    if (!visible) {
      return null;
    }
    return (
      <DateTimePicker
        value={value}
        mode="time"
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) {
            onConfirm(date);
          } else {
            onCancel();
          }
        }}
      />
    );
  }

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight, 0],
  });

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onCancel}>
      <View style={styles.fill}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <Animated.View style={[styles.backdrop, {opacity: anim}]} />
        </TouchableWithoutFeedback>

        <Animated.View
          onLayout={e => setSheetHeight(e.nativeEvent.layout.height)}
          style={[styles.sheet, {transform: [{translateY}]}]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onCancel}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={() => onConfirm(temp)}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.done}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={temp}
            mode="time"
            display="spinner"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            textColor="#181B1F"
            style={styles.picker}
            onChange={(_event: DateTimePickerEvent, date?: Date) => {
              if (date) {
                setTemp(date);
              }
            }}
          />
          <View style={styles.spacer} />
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    color: '#181B1F',
  },
  cancel: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  done: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    color: theme.colors.primary,
  },
  picker: {
    height: 216,
    width: '100%',
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
  },
  spacer: {height: theme.spacing.sm},
});

export default TimePickerSheet;

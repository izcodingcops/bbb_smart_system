import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Defs, RadialGradient, Rect, Stop} from 'react-native-svg';
import {useShiftTimer} from '../../../hooks/useShiftTimer';
import {formatClock, formatHm, formatTimeOfDay} from '../../../utils/time';
import {theme} from '../../../theme';

interface Props {
  shiftName: string;
  onEnd: () => void;
}

/**
 * Owns the once-a-second shift clock. Kept as its own component so the tick
 * re-renders only this card, not the rest of the home feed.
 */
const ShiftTimerCard: React.FC<Props> = ({shiftName, onEnd}) => {
  const {startDate, elapsedMs, remainingMs, progress, paused, toggleBreak} =
    useShiftTimer();
  const [size, setSize] = useState({w: 0, h: 0});

  return (
    <View style={styles.shadow}>
      <LinearGradient
        colors={['#1E72C4', '#0A5AAB']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.card}
        onLayout={e =>
          setSize({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          })
        }>
        {size.w > 0 ? (
          <Svg
            width={size.w}
            height={size.h}
            style={StyleSheet.absoluteFill}
            pointerEvents="none">
            <Defs>
              <RadialGradient
                id="shiftGlowA"
                cx={size.w * 0.2}
                cy={size.h * 0.05}
                r={size.w * 0.5}
                gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.32} />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
              </RadialGradient>
              <RadialGradient
                id="shiftGlowB"
                cx={size.w * 0.92}
                cy={size.h * 0.95}
                r={size.w * 0.42}
                gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.14} />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width={size.w} height={size.h} fill="url(#shiftGlowA)" />
            <Rect width={size.w} height={size.h} fill="url(#shiftGlowB)" />
          </Svg>
        ) : null}

        <View style={styles.inner}>
          <View style={styles.top}>
            <View style={styles.chip}>
              <View style={styles.greenDot} />
              <Text style={styles.chipText} numberOfLines={1}>
                {paused ? 'On Break' : shiftName}
              </Text>
            </View>
            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.breakBtn}
                activeOpacity={0.85}
                onPress={toggleBreak}>
                <Text style={styles.breakText}>
                  {paused ? 'Resume' : 'Break'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.endBtn}
                activeOpacity={0.85}
                onPress={onEnd}>
                <Text style={styles.endText}>End</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.timer}>{formatClock(elapsedMs)}</Text>
          <Text style={styles.started}>
            Shift Started today · {formatTimeOfDay(startDate)}
          </Text>

          <View style={styles.track}>
            <View style={[styles.fill, {width: `${progress * 100}%`}]} />
          </View>
          <View style={styles.labels}>
            <Text style={styles.label}>{formatHm(elapsedMs)} elapsed</Text>
            <Text style={styles.label}>{formatHm(remainingMs)} left</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 20,
    shadowColor: '#0A5AAB',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {borderRadius: 20, overflow: 'hidden'},
  inner: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  greenDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A'},
  chipText: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.white,
    flexShrink: 1,
  },
  buttons: {flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0},
  breakBtn: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  breakText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.white,
  },
  endBtn: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.white,
  },
  endText: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.primary,
  },
  timer: {
    fontFamily: theme.fonts.black,
    fontSize: 40,
    letterSpacing: 1,
    color: theme.colors.white,
  },
  started: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    marginBottom: theme.spacing.xl,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  fill: {height: 6, borderRadius: 3, backgroundColor: theme.colors.white},
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  label: {fontFamily: theme.fonts.black, fontSize: 12.5, color: '#FFFFFF'},
});

export default ShiftTimerCard;

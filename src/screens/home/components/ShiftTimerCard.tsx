import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Defs, RadialGradient, Rect, Stop} from 'react-native-svg';
import {ClockIcon} from '../../../components/icons';
import {useShiftTimer} from '../../../hooks/useShiftTimer';
import {formatClock, formatHm, formatTimeOfDay} from '../../../utils/time';
import {theme} from '../../../theme';

interface Props {
  onEnd: () => void;
}

/**
 * Owns the once-a-second shift clock. Kept as its own component so the tick
 * re-renders only this card, not the rest of the home feed.
 */
const ShiftTimerCard: React.FC<Props> = ({onEnd}) => {
  const {startDate, elapsedMs, remainingMs, progress, paused, toggleBreak} =
    useShiftTimer();

  return (
    <View style={styles.shadow}>
      <LinearGradient
        colors={['#1E72C4', '#0A5AAB']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.card}>
        {/*
         * Glow is drawn in objectBoundingBox units (cx/cy/r as 0–1 fractions of
         * this Svg) so it paints in the same first frame as the gradient above,
         * instead of popping in after an onLayout measurement pass.
         */}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="shiftGlowA" cx="0.2" cy="0.05" r="0.5">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.32} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="shiftGlowB" cx="0.92" cy="0.95" r="0.42">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.14} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#shiftGlowA)"
          />
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#shiftGlowB)"
          />
        </Svg>

        <View style={styles.inner}>
          <View style={styles.top}>
            <Text style={styles.timer}>{formatClock(elapsedMs)}</Text>
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

          <View style={styles.started}>
            <ClockIcon size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.startedText} numberOfLines={1}>
              {paused ? 'On Break' : 'Shift Started today'} · {formatTimeOfDay(startDate)}
            </Text>
          </View>

          <View style={styles.track}>
            <View style={[styles.fill, {width: `${progress * 100}%`}]} />
          </View>
          <View style={styles.labels}>
            <Text style={styles.label}>{formatHm(elapsedMs)} elapsed</Text>
            <Text style={styles.label}>{formatHm(elapsedMs + remainingMs)} shift</Text>
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
    // Paints above the offline notice below it, so this card's shadow falls
    // across that card's top edge instead of being covered by it.
    zIndex: 1,
  },
  card: {borderRadius: 20, overflow: 'hidden'},
  inner: {
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 14,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  buttons: {flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0},
  breakBtn: {
    height: 36,
    justifyContent: 'center',
    borderRadius: 11,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  breakText: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.white,
  },
  endBtn: {
    height: 36,
    justifyContent: 'center',
    borderRadius: 11,
    paddingHorizontal: 15,
    backgroundColor: theme.colors.white,
  },
  endText: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.primary,
  },
  timer: {
    fontFamily: theme.fonts.black,
    fontSize: 30,
    letterSpacing: -0.5,
    color: theme.colors.white,
    fontVariant: ['tabular-nums'],
  },
  started: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: theme.spacing.md,
  },
  startedText: {
    flexShrink: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  fill: {height: 5, borderRadius: 3, backgroundColor: theme.colors.white},
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  label: {fontFamily: theme.fonts.bold, fontSize: 12.5, color: 'rgba(255,255,255,0.9)'},
});

export default ShiftTimerCard;

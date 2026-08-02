import React, {useState} from 'react';
import {Animated, DimensionValue, StyleProp, StyleSheet, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const BONE_COLOR = '#E9ECEF';
const HIGHLIGHT_COLOR = 'rgba(255,255,255,0.75)';
const SHIMMER_DURATION = 1100;

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * One driver shared by every bone on screen, instead of a loop per bone —
 * a Maintenance/Fixture skeleton list can mount 50+ bones at once, and a
 * shared clock keeps that at a single native animation loop (and in sync).
 */
const shimmerProgress = new Animated.Value(0);
Animated.loop(
  Animated.timing(shimmerProgress, {
    toValue: 1,
    duration: SHIMMER_DURATION,
    useNativeDriver: true,
  }),
).start();

interface Props {
  width: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** A single shimmering placeholder block — the building block for skeleton screens. */
const Skeleton: React.FC<Props> = ({width, height = 14, radius = 6, style}) => {
  const [boneWidth, setBoneWidth] = useState(0);

  const translateX = shimmerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-boneWidth, boneWidth],
  });

  return (
    <Animated.View
      onLayout={e => setBoneWidth(e.nativeEvent.layout.width)}
      style={[
        {width, height, borderRadius: radius, backgroundColor: BONE_COLOR},
        styles.clip,
        style,
      ]}>
      {boneWidth > 0 ? (
        <AnimatedGradient
          colors={['transparent', HIGHLIGHT_COLOR, 'transparent']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={[StyleSheet.absoluteFill, {transform: [{translateX}]}]}
        />
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  clip: {overflow: 'hidden'},
});

export default Skeleton;

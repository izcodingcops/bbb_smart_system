import React from 'react';
import {StyleSheet, useWindowDimensions, View, ViewStyle} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import {theme} from '../theme';

interface Props {
  children?: React.ReactNode;
  style?: ViewStyle;
}

const {base, greenWash, blueWash} = theme.gradients.screen;

/**
 * Shared app background for the glass design language: a vertical ramp from a
 * cool blue at the top to a faintly green bottom, plus two elliptical washes —
 * blue centred off the right edge, green rising from below the bottom edge.
 *
 * Transcribed from the three stacked fills on the Figma frame; the wash
 * geometry is expressed as fractions of the viewport (see `theme.gradients
 * .screen`) so it scales with the device instead of being pinned to the 392pt
 * design frame.
 */
const ScreenBackground: React.FC<Props> = ({children, style}) => {
  const {width, height} = useWindowDimensions();

  return (
    <View style={[styles.root, style]}>
      <Svg
        style={StyleSheet.absoluteFill}
        width={width}
        height={height}
        pointerEvents="none">
        <Defs>
          <LinearGradient id="base" x1="0" y1="0" x2="0" y2="1">
            {base.map(stop => (
              <Stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
              />
            ))}
          </LinearGradient>
          {/* userSpaceOnUse rather than the default objectBoundingBox: the
           *  washes are ellipses, and only user space lets rx/ry differ. */}
          <RadialGradient
            id="green"
            cx={greenWash.cx * width}
            cy={greenWash.cy * height}
            rx={greenWash.rx * width}
            ry={greenWash.ry * height}
            gradientUnits="userSpaceOnUse">
            {greenWash.stops.map(stop => (
              <Stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
                stopOpacity={stop.opacity}
              />
            ))}
          </RadialGradient>
          <RadialGradient
            id="blue"
            cx={blueWash.cx * width}
            cy={blueWash.cy * height}
            rx={blueWash.rx * width}
            ry={blueWash.ry * height}
            gradientUnits="userSpaceOnUse">
            {blueWash.stops.map(stop => (
              <Stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
                stopOpacity={stop.opacity}
              />
            ))}
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#base)" />
        <Rect width={width} height={height} fill="url(#green)" />
        <Rect width={width} height={height} fill="url(#blue)" />
      </Svg>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
});

export default ScreenBackground;

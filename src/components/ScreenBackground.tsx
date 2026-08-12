import React, {useCallback, useState} from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
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
 * geometry is expressed as fractions of this view's own box (see
 * `theme.gradients.screen`) so it scales with the device instead of being
 * pinned to the 392pt design frame.
 *
 * Measured with onLayout rather than `useWindowDimensions`: this view is
 * `flex: 1` inside its parent, so on a tab screen it is roughly a tab bar
 * shorter than the window. Sizing to the window there drew the ramp ~100pt too
 * tall and clipped the bottom wash away entirely, which is why list and detail
 * screens didn't match each other. Window size seeds the first frame, so
 * nothing flashes before layout arrives.
 */
const ScreenBackground: React.FC<Props> = ({children, style}) => {
  const window = useWindowDimensions();
  const [size, setSize] = useState({
    width: window.width,
    height: window.height,
  });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const {width: w, height: h} = event.nativeEvent.layout;
    setSize(current =>
      current.width === w && current.height === h
        ? current
        : {width: w, height: h},
    );
  }, []);

  const {width, height} = size;

  return (
    <View style={[styles.root, style]} onLayout={handleLayout}>
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

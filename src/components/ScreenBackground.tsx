import React from 'react';
import {StyleSheet, useWindowDimensions, View, ViewStyle} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

interface Props {
  children?: React.ReactNode;
  style?: ViewStyle;
}

// Reference frame the design blob positions were measured in.
const FRAME_W = 392;

/**
 * Shared app background: a near-white diagonal base with two soft radial
 * "blobs" (blue top-left, green top-right) fading to transparent — mirroring
 * the Gradient+Blur layers from the Figma design. Positions/sizes scale with
 * the device width so the wash sits consistently across screen sizes.
 */
const ScreenBackground: React.FC<Props> = ({children, style}) => {
  const {width, height} = useWindowDimensions();
  const scale = width / FRAME_W;

  const blue = {cx: 90 * scale, cy: 70 * scale, r: 160 * scale};
  const green = {cx: 322 * scale, cy: 110 * scale, r: 150 * scale};

  return (
    <View style={[styles.root, style]}>
      <Svg
        style={StyleSheet.absoluteFill}
        width={width}
        height={height}
        pointerEvents="none">
        <Defs>
          <LinearGradient id="base" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FDFDFE" />
            <Stop offset="0.5" stopColor="#F4F6F8" />
            <Stop offset="1" stopColor="#EEF1F4" />
          </LinearGradient>
          <RadialGradient
            id="blue"
            cx={blue.cx}
            cy={blue.cy}
            r={blue.r}
            gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#BFE1FF" stopOpacity="1" />
            <Stop offset="1" stopColor="#BFE1FF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            id="green"
            cx={green.cx}
            cy={green.cy}
            r={green.r}
            gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#D7EFC6" stopOpacity="1" />
            <Stop offset="1" stopColor="#D7EFC6" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#base)" />
        <Rect width={width} height={height} fill="url(#blue)" opacity={0.6} />
        <Rect width={width} height={height} fill="url(#green)" opacity={0.6} />
      </Svg>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
});

export default ScreenBackground;

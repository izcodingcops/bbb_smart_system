import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/**
 * The QR viewfinder: four detached corner brackets. Ported verbatim from the
 * design's `i-scan` symbol — deliberately not a camera glyph, which reads as
 * "take a photo" rather than "scan a code".
 */
const ScanIcon: React.FC<Props> = ({size = 24, color = '#2B3038'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 8V5.5A1.5 1.5 0 015.5 4H8M16 4h2.5A1.5 1.5 0 0120 5.5V8M20 16v2.5a1.5 1.5 0 01-1.5 1.5H16M8 20H5.5A1.5 1.5 0 014 18.5V16"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default ScanIcon;

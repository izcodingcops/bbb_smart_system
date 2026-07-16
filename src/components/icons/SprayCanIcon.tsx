import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const SprayCanIcon: React.FC<Props> = ({size = 24, color = '#0066B2'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 9.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V9.5Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Path
      d="M10.5 7.5V4.5h2v3"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M18 4h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M20.5 6.5h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M18 9h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export default SprayCanIcon;

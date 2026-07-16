import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const WifiOffIcon: React.FC<Props> = ({size = 24, color = '#667085'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 8.8a15 15 0 0 1 20 0"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Path
      d="M5 12.3a10 10 0 0 1 14 0"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Path
      d="M8.5 15.8a5 5 0 0 1 7 0"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Path d="M12 19.5h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path
      d="M3 3.5l18 17"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export default WifiOffIcon;

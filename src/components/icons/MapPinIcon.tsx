import React from 'react';
import Svg, {Path, Circle} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const MapPinIcon: React.FC<Props> = ({size = 22, color = '#FFFFFF'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s7-6.13 7-12a7 7 0 1 0-14 0c0 5.87 7 12 7 12Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={10} r={2.5} stroke={color} strokeWidth={1.8} />
  </Svg>
);

export default MapPinIcon;

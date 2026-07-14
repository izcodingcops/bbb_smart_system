import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const ClockIcon: React.FC<Props> = ({size = 20, color = '#0066B2'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
    <Path
      d="M12 7v5l3 2"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default ClockIcon;

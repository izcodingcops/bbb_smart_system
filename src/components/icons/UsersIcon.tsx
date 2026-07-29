import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const UsersIcon: React.FC<Props> = ({size = 24, color = '#5B5F66'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={9} cy={8.5} r={3.1} stroke={color} strokeWidth={1.7} />
    <Path
      d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
    <Path
      d="M16 6.2a2.9 2.9 0 010 5.6M17.5 19.5c0-2.4-1.2-4.2-3-4.7"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </Svg>
);

export default UsersIcon;

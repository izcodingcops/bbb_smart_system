import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const TrashIcon: React.FC<Props> = ({size = 24, color = '#C98A16'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3.5 6h17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path
      d="M8 6V4.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2V6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 6v13a2.5 2.5 0 0 1-2.5 2.5H8A2.5 2.5 0 0 1 5.5 19V6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M10 10.5v6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M14 10.5v6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export default TrashIcon;

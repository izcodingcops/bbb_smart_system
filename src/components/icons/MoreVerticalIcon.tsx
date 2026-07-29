import React from 'react';
import Svg, {Circle} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const MoreVerticalIcon: React.FC<Props> = ({size = 18, color = '#9CA3AF'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={5.2} r={1.9} fill={color} />
    <Circle cx={12} cy={12} r={1.9} fill={color} />
    <Circle cx={12} cy={18.8} r={1.9} fill={color} />
  </Svg>
);

export default MoreVerticalIcon;

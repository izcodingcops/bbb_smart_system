import React from 'react';
import Svg, {Rect, Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const ManagementIcon: React.FC<Props> = ({size = 22, color = '#374151'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={5}
      y={4}
      width={14}
      height={17}
      rx={2.5}
      stroke={color}
      strokeWidth={1.7}
    />
    <Rect
      x={9}
      y={2.5}
      width={6}
      height={3.5}
      rx={1}
      stroke={color}
      strokeWidth={1.7}
    />
    <Path
      d="M8.5 11h7M8.5 15h4"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </Svg>
);

export default ManagementIcon;

import React from 'react';
import Svg, {Path, Rect} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const CalendarIcon: React.FC<Props> = ({size = 19, color = '#9CA3AF'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={3.5}
      y={5}
      width={17}
      height={16}
      rx={3}
      stroke={color}
      strokeWidth={1.8}
    />
    <Path
      d="M3.5 9.5h17M8 3.5v3M16 3.5v3"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export default CalendarIcon;

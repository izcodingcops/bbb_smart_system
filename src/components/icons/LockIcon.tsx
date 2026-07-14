import React from 'react';
import Svg, {Rect, Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const LockIcon: React.FC<Props> = ({size = 20, color = '#9CA3AF'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={4}
      y={10}
      width={16}
      height={11}
      rx={2.5}
      stroke={color}
      strokeWidth={1.8}
    />
    <Path
      d="M8 10V7a4 4 0 0 1 8 0v3"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export default LockIcon;

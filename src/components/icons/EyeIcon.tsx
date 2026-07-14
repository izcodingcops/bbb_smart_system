import React from 'react';
import Svg, {Path, Circle, Line} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  off?: boolean;
}

const EyeIcon: React.FC<Props> = ({size = 20, color = '#9CA3AF', off = false}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    {off ? (
      <Line
        x1={4}
        y1={4}
        x2={20}
        y2={20}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    ) : null}
  </Svg>
);

export default EyeIcon;

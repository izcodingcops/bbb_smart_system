import React from 'react';
import Svg, {Path, Rect} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Exact path from the Ambassador mockups' #i-work symbol. */
const WorkIcon: React.FC<Props> = ({size = 20, color = '#181B1F'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={7.5} width={18} height={12.5} rx={2.4} stroke={color} strokeWidth={1.7} />
    <Path
      d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3 12.5h18"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </Svg>
);

export default WorkIcon;

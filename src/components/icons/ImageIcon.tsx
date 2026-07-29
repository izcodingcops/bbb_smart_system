import React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const ImageIcon: React.FC<Props> = ({size = 20, color = '#0066B2'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={3}
      y={4}
      width={18}
      height={16}
      rx={2.4}
      stroke={color}
      strokeWidth={1.7}
    />
    <Circle cx={8.5} cy={9.5} r={1.8} stroke={color} strokeWidth={1.6} />
    <Path
      d="M4 17l5.5-5.5L13 15l2.5-2.5L20 17"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default ImageIcon;

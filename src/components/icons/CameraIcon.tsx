import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const CameraIcon: React.FC<Props> = ({size = 20, color = '#0066B2'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 8.5A2 2 0 016 6.5h2l1-2h6l1 2h2a2 2 0 012 2V17a2 2 0 01-2 2H6a2 2 0 01-2-2z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={12.2} r={3.4} stroke={color} strokeWidth={1.7} />
  </Svg>
);

export default CameraIcon;

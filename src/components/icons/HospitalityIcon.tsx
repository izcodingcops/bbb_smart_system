import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const HospitalityIcon: React.FC<Props> = ({size = 22, color = '#374151'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
    <Path
      d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17M6 3v1.5M10 3v1.5M14 3v1.5"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </Svg>
);

export default HospitalityIcon;

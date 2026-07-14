import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const SafetyIcon: React.FC<Props> = ({size = 22, color = '#374151'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
    <Path
      d="M9 12l2 2 4-4"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default SafetyIcon;

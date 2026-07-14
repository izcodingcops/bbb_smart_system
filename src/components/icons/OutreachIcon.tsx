import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const OutreachIcon: React.FC<Props> = ({size = 22, color = '#374151'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1Z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
    <Path
      d="M17 9a4 4 0 0 1 0 6M19.5 6.5a7 7 0 0 1 0 11"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </Svg>
);

export default OutreachIcon;

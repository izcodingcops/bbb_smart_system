import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const BellIcon: React.FC<Props> = ({size = 22, color = '#181B1F'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9a6 6 0 0 1 12 0c0 4 1.2 5.6 2 6.5H4c.8-.9 2-2.5 2-6.5Z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
    <Path
      d="M10 19a2 2 0 0 0 4 0"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </Svg>
);

export default BellIcon;

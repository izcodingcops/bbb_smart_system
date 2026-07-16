import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const BoxIcon: React.FC<Props> = ({size = 20, color = '#181B1F'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.5 7.8v8.4a2 2 0 0 1-1 1.7l-6.5 3.7a2 2 0 0 1-2 0l-6.5-3.7a2 2 0 0 1-1-1.7V7.8a2 2 0 0 1 1-1.7l6.5-3.7a2 2 0 0 1 2 0l6.5 3.7a2 2 0 0 1 1 1.7Z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="m3.8 6.9 8.2 4.7 8.2-4.7"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 21v-9.4"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default BoxIcon;

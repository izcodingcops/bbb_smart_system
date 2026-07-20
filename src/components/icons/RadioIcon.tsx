import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const RadioIcon: React.FC<Props> = ({size = 20, color = '#6D4AFF'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 9.5h16a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1Z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
    <Path
      d="m8 9.5 10-5"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
    <Circle cx={9} cy={15} r={2.75} stroke={color} strokeWidth={1.7} />
    <Path d="M15 13.5h3" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    <Path d="M15 16.5h3" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>
);

export default RadioIcon;

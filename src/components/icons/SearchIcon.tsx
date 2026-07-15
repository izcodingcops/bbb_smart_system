import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const SearchIcon: React.FC<Props> = ({size = 20, color = '#9CA3AF'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={1.8} />
    <Path
      d="M20 20l-3.2-3.2"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export default SearchIcon;

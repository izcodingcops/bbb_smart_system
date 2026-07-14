import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const PlayIcon: React.FC<Props> = ({size = 18, color = '#FFFFFF'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 5l12 7-12 7V5Z" fill={color} />
  </Svg>
);

export default PlayIcon;

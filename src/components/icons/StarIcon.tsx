import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const StarIcon: React.FC<Props> = ({size = 12, color = '#389E0D'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2.5l2.9 6.28 6.6.8-4.9 4.66 1.28 6.76L12 17.7l-5.88 3.3 1.28-6.76-4.9-4.66 6.6-.8L12 2.5z"
      fill={color}
    />
  </Svg>
);

export default StarIcon;

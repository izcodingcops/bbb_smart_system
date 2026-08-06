import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const MinusIcon: React.FC<Props> = ({size = 24, color = '#181B1F'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12H19"
      stroke={color}
      strokeWidth={2.08333}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default MinusIcon;

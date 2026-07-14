import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const CheckIcon: React.FC<Props> = ({size = 16, color = '#FFFFFF'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12.5l4.5 4.5L19 7"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default CheckIcon;

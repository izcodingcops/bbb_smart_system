import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const CloudOffIcon: React.FC<Props> = ({size = 13, color = '#C26401'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 18H7a4 4 0 01-.6-7.95M8 8a5 5 0 019.6 1.4A3.5 3.5 0 0119.5 15M3 3l18 18"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default CloudOffIcon;

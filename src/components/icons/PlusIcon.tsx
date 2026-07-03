import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const PlusIcon: React.FC<Props> = ({size = 24, color = '#FFFFFF'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4.99921V18.9992M5.00004 11.9992H19"
      stroke={color}
      strokeWidth={2.08333}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default PlusIcon;

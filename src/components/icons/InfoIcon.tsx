import React from 'react';
import Svg, {Path, Circle} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const InfoIcon: React.FC<Props> = ({size = 18, color = '#0066B2'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9.2} stroke={color} strokeWidth={1.8} />
    <Path
      d="M12 11.2V16.4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Circle cx={12} cy={7.9} r={1.05} fill={color} />
  </Svg>
);

export default InfoIcon;

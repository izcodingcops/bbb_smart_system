import React from 'react';
import Svg, {Path, Circle} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const TargetIcon: React.FC<Props> = ({size = 20, color = '#0066B2'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={7.2} stroke={color} strokeWidth={1.8} />
    <Circle cx={12} cy={12} r={2.6} stroke={color} strokeWidth={1.8} />
    <Path
      d="M12 1.8V4.4M12 19.6V22.2M1.8 12H4.4M19.6 12H22.2"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export default TargetIcon;

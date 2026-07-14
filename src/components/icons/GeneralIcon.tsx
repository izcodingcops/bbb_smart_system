import React from 'react';
import Svg, {Rect, Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const GeneralIcon: React.FC<Props> = ({size = 22, color = '#374151'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={3}
      y={7}
      width={18}
      height={13}
      rx={2.5}
      stroke={color}
      strokeWidth={1.7}
    />
    <Path
      d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </Svg>
);

export default GeneralIcon;

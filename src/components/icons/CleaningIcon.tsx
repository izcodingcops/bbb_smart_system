import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const CleaningIcon: React.FC<Props> = ({size = 22, color = '#FFFFFF'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 3h3v3h-3zM11.5 6v2M9 8h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M10 12h4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>
);

export default CleaningIcon;

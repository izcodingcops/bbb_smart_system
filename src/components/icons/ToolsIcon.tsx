import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const ToolsIcon: React.FC<Props> = ({size = 20, color = '#181B1F'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14.5 6.5a3.5 3.5 0 0 0 4.6 4.6l2.4 2.4a2 2 0 0 1-2.8 2.8l-2.4-2.4a3.5 3.5 0 0 0-4.6-4.6l2.8-2.8Z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="m9 9-6.5 6.5a2 2 0 0 0 2.8 2.8L11.8 12"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="m4 4 4 4"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default ToolsIcon;

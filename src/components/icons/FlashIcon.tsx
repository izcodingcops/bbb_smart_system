import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const FlashIcon: React.FC<Props> = ({size = 20, color = '#0066B2'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 8.5h6v2.5l-1 2v6.5a1 1 0 01-1 1h-2a1 1 0 01-1-1V13l-1-2zM9 8.5V6h6v2.5M12 3v1.4M9.4 4.3l.6 1M14.6 4.3l-.6 1"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default FlashIcon;

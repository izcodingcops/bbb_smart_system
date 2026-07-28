import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Three descending bars — the usual "sort" affordance. */
const SortIcon: React.FC<Props> = ({size = 20, color = '#475467'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 7h16M6.5 12h11M10 17h4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export default SortIcon;

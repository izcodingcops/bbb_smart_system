import {isIOS} from '../utils/platformUtil';

// Lato weights available: Light (300), Regular (400), Bold (700), Black (900)
// For italic: use fontFamily: LATO.regular + fontStyle: 'italic'  (iOS loads Lato-Italic automatically)
export const fontFamilies = {
  LATO: {
    light: isIOS() ? 'Lato-Light' : 'LatoLight',
    regular: isIOS() ? 'Lato-Regular' : 'LatoRegular',
    medium: isIOS() ? 'Lato-Regular' : 'LatoRegular',
    bold: isIOS() ? 'Lato-Bold' : 'LatoBold',
    black: isIOS() ? 'Lato-Black' : 'LatoBlack',
    normal: isIOS() ? 'Lato-Regular' : 'LatoRegular',
  },
};

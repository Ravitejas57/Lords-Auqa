import { Platform } from 'react-native';

/**
 * Global font configuration
 * Use this constant to apply Nunito font consistently across the app
 */
export const defaultFontFamily = Platform.select({
  ios: 'Nunito_400Regular',
  android: 'Nunito_400Regular',
  default: 'Nunito_400Regular',
  web: "'Nunito', sans-serif",
});

/**
 * Default text style with Nunito font
 * Use this in StyleSheet.create() for consistent font styling
 */
export const defaultTextStyle = {
  fontFamily: defaultFontFamily,
};


import React from 'react';
import { Text as RNText, TextProps as RNTextProps, Platform, StyleSheet } from 'react-native';

export interface TextProps extends RNTextProps {
  children?: React.ReactNode;
}

/**
 * Global Text component that applies Nunito font by default
 * Use this instead of React Native's Text component for consistent font styling
 */
export const Text: React.FC<TextProps> = ({ style, ...props }) => {
  return (
    <RNText
      style={[
        styles.default,
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  default: {
    fontFamily: Platform.select({
      ios: 'Nunito_400Regular',
      android: 'Nunito_400Regular',
      default: 'Nunito_400Regular',
      web: "'Nunito', sans-serif",
    }),
  },
});

export default Text;


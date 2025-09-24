import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();
  
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size], disabled && styles.disabled];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, { backgroundColor: colors.primary }];
      case 'secondary':
        return [...baseStyle, { backgroundColor: colors.surface }];
      case 'outline':
        return [...baseStyle, { 
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.primary,
        }];
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`], disabled && styles.disabledText];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, { color: '#FFFFFF' }];
      case 'secondary':
        return [...baseStyle, { color: colors.text }];
      case 'outline':
        return [...baseStyle, { color: colors.primary }];
      default:
        return baseStyle;
    }
  };

  const buttonStyle = [...getButtonStyle(), style];
  const textStyleCombined = [...getTextStyle(), textStyle];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.primary} />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sm: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.6,
  },
});

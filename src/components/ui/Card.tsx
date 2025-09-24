import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass';
  style?: ViewStyle;
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export function Card({ children, variant = 'default', style }: CardProps) {
  const { colors } = useTheme();
  
  const dynamicStyles = StyleSheet.create({
    card: {
      borderRadius: 16,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    default: {
      backgroundColor: colors.card,
      padding: 16,
    },
    glass: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
  });

  return (
    <View style={[dynamicStyles.card, dynamicStyles[variant], style]}>
      {children}
    </View>
  );
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
}

export function CardContent({ children, style }: CardContentProps) {
  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );
}

export function CardTitle({ children, style }: CardTitleProps) {
  const { colors } = useTheme();
  
  const dynamicStyles = StyleSheet.create({
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
  });

  return (
    <Text style={[dynamicStyles.title, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
});

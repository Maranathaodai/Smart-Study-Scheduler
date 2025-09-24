import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ProgressBarProps {
  value: number;
  max: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  value,
  max,
  showLabel = false,
  size = 'md',
  style,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeStyles = {
    sm: styles.sm,
    md: styles.md,
    lg: styles.lg,
  };

  const textSizeStyles = {
    sm: styles.smText,
    md: styles.mdText,
    lg: styles.lgText,
  };

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, textSizeStyles[size]]}>
            {Math.round(percentage)}% Complete
          </Text>
          <Text style={[styles.value, textSizeStyles[size]]}>
            {value} / {max}
          </Text>
        </View>
      )}
      <View style={[styles.progressContainer, sizeStyles[size]]}>
        <View
          style={[
            styles.progressBar,
            sizeStyles[size],
            { width: `${percentage}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#000000',
    fontWeight: '500',
  },
  value: {
    color: '#8E8E93',
    fontWeight: '400',
  },
  progressContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBar: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  sm: {
    height: 4,
  },
  md: {
    height: 8,
  },
  lg: {
    height: 12,
  },
  smText: {
    fontSize: 12,
  },
  mdText: {
    fontSize: 14,
  },
  lgText: {
    fontSize: 16,
  },
});

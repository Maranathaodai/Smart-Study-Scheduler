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
  // Handle division by zero and NaN values
  const safeValue = isNaN(value) || !isFinite(value) ? 0 : value;
  const safeMax = isNaN(max) || !isFinite(max) || max <= 0 ? 1 : max;
  const percentage = Math.min((safeValue / safeMax) * 100, 100);

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
            {safeValue} / {safeMax}
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

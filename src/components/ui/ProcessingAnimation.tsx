import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface ProcessingAnimationProps {
  progress: number;
  status: string;
  isVisible: boolean;
  fileName?: string;
  fileCount?: number;
  currentFileIndex?: number;
}

export const ProcessingAnimation: React.FC<ProcessingAnimationProps> = ({
  progress,
  status,
  isVisible,
  fileName,
  fileCount = 1,
  currentFileIndex = 1,
}) => {
  const { colors, isDarkMode } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Start animations
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: progress,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    }
  }, [progress, isVisible]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  if (!isVisible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Animated.View 
          style={[
            styles.iconContainer, 
            { 
              backgroundColor: colors.primary,
              transform: [{ scale: pulseAnim }, { rotate: spin }]
            }
          ]}
        >
          <Text style={[styles.icon, { color: colors.surface }]}>⚡</Text>
        </Animated.View>
        <Text style={[styles.title, { color: colors.text }]}>
          AI Processing
        </Text>
      </View>

      {/* File Info */}
      {fileName && (
        <View style={styles.fileInfo}>
          <Text style={[styles.fileName, { color: colors.textSecondary }]}>
            {fileName}
          </Text>
          {fileCount > 1 && (
            <Text style={[styles.fileCount, { color: colors.textSecondary }]}>
              File {currentFileIndex} of {fileCount}
            </Text>
          )}
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: progressWidth,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.text }]}>
          {Math.round(progress)}%
        </Text>
      </View>

      {/* Status */}
      <Text style={[styles.status, { color: colors.textSecondary }]}>
        {status}
      </Text>

      {/* Processing Steps */}
      <View style={styles.stepsContainer}>
        {getProcessingSteps(progress).map((step, index) => (
          <View key={index} style={styles.step}>
            <View
              style={[
                styles.stepIcon,
                {
                  backgroundColor: step.completed
                    ? colors.success
                    : step.active
                    ? colors.primary
                    : colors.border,
                },
              ]}
            >
              <Text style={styles.stepText}>
                {step.completed ? '✓' : step.active ? '⚡' : '○'}
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                {
                  color: step.completed
                    ? colors.success
                    : step.active
                    ? colors.primary
                    : colors.textSecondary,
                },
              ]}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Animated Dots */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: colors.primary,
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [0.8, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// Helper function to determine processing steps based on progress
const getProcessingSteps = (progress: number) => {
  const steps = [
    { label: 'Reading File', completed: progress > 10, active: progress <= 10 },
    { label: 'Extracting Content', completed: progress > 30, active: progress > 10 && progress <= 30 },
    { label: 'AI Analysis', completed: progress > 60, active: progress > 30 && progress <= 60 },
    { label: 'Creating Chunks', completed: progress > 85, active: progress > 60 && progress <= 85 },
    { label: 'Finalizing', completed: progress >= 100, active: progress > 85 && progress < 100 },
  ];
  return steps;
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  fileInfo: {
    marginBottom: 20,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileCount: {
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  status: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  stepsContainer: {
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default ProcessingAnimation;

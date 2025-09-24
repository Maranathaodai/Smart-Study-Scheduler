import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { Button } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Organize Your Learning',
    description: 'Upload your course materials and get a clean, tailored schedule that fits your life.',
    icon: 'terminal-outline',
    color: '#0F172A',
  },
  {
    id: 2,
    title: 'Smart Scheduling',
    description: 'Get optimal study sessions based on your learning patterns and available time.',
    icon: 'calendar-outline',
    color: '#0F172A',
  },
  {
    id: 3,
    title: 'Track Progress',
    description: 'Monitor your learning journey with detailed analytics and progress tracking.',
    icon: 'analytics-outline',
    color: '#0F172A',
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    console.log('Current index:', currentIndex, 'Total pages:', onboardingData.length);
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topSpacer} />
        <Text style={styles.topSpacer} />
        <Text
          onPress={handleSkip}
          style={styles.skipLink}
        >
          Skip
        </Text>
      </View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {onboardingData.map((item) => (
          <View key={item.id} style={[styles.slide, { width }]}>
            {item.title === 'Track Progress' ? (
              <Image
                source={require('../images/tracker.png')}
                style={{ width: 160, height: 160, marginBottom: 2 }}
                resizeMode="contain"
              />
            ) : item.title === 'Organize Your Learning' ? (
              <Image
                source={require('../images/organize.png')}
                style={{ width: 160, height: 160, marginBottom: 2 }}
                resizeMode="contain"
              />
            ) : item.title === 'Smart Scheduling' ? (
              <Image
                source={require('../images/schedule.png')}
                style={{ width: 160, height: 160, marginBottom: 2 }}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={72} color={item.color} />
              </View>
            )}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={styles.nextButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topSpacer: {
    width: 24,
  },
  skipLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D1D6',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  nextButton: {
    width: '60%',
  },
});

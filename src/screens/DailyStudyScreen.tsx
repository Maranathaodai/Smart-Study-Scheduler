import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { dummySessions, dummyCourses } from '../lib/dummy-data';
import { Ionicons } from '@expo/vector-icons';

export default function DailyStudyScreen() {
  const navigation = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [session, setSession] = useState(dummySessions[0]);
  const [course] = useState(dummyCourses.find(c => c.id === session.courseId));
  const [isCompleted, setIsCompleted] = useState(false);

  const totalSlides = session.slides;
  const progress = (currentSlide / totalSlides) * 100;

  const handleNextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setIsCompleted(true);
      Alert.alert(
        'Congratulations! 🎉',
        'You have completed today\'s study session!',
        [
          {
            text: 'Great!',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const handlePreviousSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleCompleteSession = () => {
    Alert.alert(
      'Complete Session',
      'Are you sure you want to mark this session as complete?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            setIsCompleted(true);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>Study Session</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle style={styles.courseTitle}>
              {course?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.sessionInfo}>
              Today's session • {totalSlides} slides
            </Text>
            
            <View style={styles.progressContainer}>
              <ProgressBar
                value={currentSlide}
                max={totalSlides}
                showLabel
                size="lg"
              />
            </View>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Slide {currentSlide + 1} of {totalSlides}</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.slideContent}>
              <Text style={styles.slideTitle}>
                {course?.name} - Chapter {Math.floor(currentSlide / 4) + 1}
              </Text>
              <Text style={styles.slideDescription}>
                This is slide {currentSlide + 1} content. Here you would display
                the actual slide content from your course materials.
              </Text>
              
              <View style={styles.slidePlaceholder}>
                <Ionicons name="document-text" size={48} color="#8E8E93" />
                <Text style={styles.placeholderText}>
                  Slide content would appear here
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <View style={styles.navigationButtons}>
          <Button
            title="Previous"
            onPress={handlePreviousSlide}
            variant="outline"
            disabled={currentSlide === 0}
            style={styles.navButton}
          />
          
          <Button
            title={currentSlide === totalSlides - 1 ? 'Complete' : 'Next'}
            onPress={currentSlide === totalSlides - 1 ? handleCompleteSession : handleNextSlide}
            style={styles.navButton}
          />
        </View>

        <Card style={styles.tipsCard}>
          <CardHeader>
            <CardTitle style={styles.tipsTitle}>
              <Ionicons name="bulb" size={20} color="#FF9500" />
              <Text style={styles.tipsTitleText}>Study Tips</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.tipText}>
              • Take breaks every 25 minutes
            </Text>
            <Text style={styles.tipText}>
              • Review key concepts after each slide
            </Text>
            <Text style={styles.tipText}>
              • Take notes to reinforce learning
            </Text>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  card: {
    marginBottom: 16,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  sessionInfo: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  slideContent: {
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  slideDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  slidePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  navButton: {
    flex: 0.48,
  },
  tipsCard: {
    marginBottom: 100,
  },
  tipsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipsTitleText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  tipText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
    lineHeight: 20,
  },
});

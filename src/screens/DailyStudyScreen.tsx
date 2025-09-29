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
import { MarkdownRenderer } from '../components/ui/MarkdownRenderer';
// Removed dummy data imports
import { StudySession, StudyChunk } from '../lib/types';
import { Ionicons } from '@expo/vector-icons';

export default function DailyStudyScreen({ route }: any) {
  const navigation = useNavigation();
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [session, setSession] = useState<StudySession | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Get course and session from navigation params
  const course = route?.params?.course;
  const initialSession = route?.params?.session as StudySession;
  
  // Initialize session state
  useEffect(() => {
    if (!course) {
      Alert.alert('Error', 'No course found. Please select a course first.');
      navigation.goBack();
      return;
    }
    
    if (initialSession) {
      setSession(initialSession);
    } else {
      // If no session provided, show error and go back
      Alert.alert('Error', 'No study session found. Please select a course and session first.');
      navigation.goBack();
    }
  }, [initialSession, course, navigation]);

  // Debug logging
  console.log('DailyStudyScreen - Course:', course?.name);
  console.log('DailyStudyScreen - Session:', session);
  console.log('DailyStudyScreen - Session chunks:', session?.chunks?.length);

  if (!session) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Enhanced session with chunks (fallback to slides if no chunks)
  const hasChunks = session.chunks && session.chunks.length > 0;
  const totalChunks = hasChunks ? session.chunks.length : session.slides;
  const currentChunk = hasChunks ? session.chunks[currentChunkIndex] : null;
  const progress = hasChunks 
    ? ((session.completedChunks + (currentChunkIndex > session.currentChunkIndex ? 1 : 0)) / totalChunks) * 100
    : (currentChunkIndex / totalChunks) * 100;

  const handleNextChunk = () => {
    if (currentChunkIndex < totalChunks - 1) {
      setCurrentChunkIndex(currentChunkIndex + 1);
      // Update session progress
      if (hasChunks) {
        setSession(prev => ({
          ...prev!,
          currentChunkIndex: currentChunkIndex + 1,
          sessionProgress: ((currentChunkIndex + 1) / totalChunks) * 100,
        }));
      }
    } else {
      setIsCompleted(true);
      Alert.alert(
        'Congratulations! 🎉',
        'You have completed today\'s study session!',
        [
          {
            text: 'Great!',
            onPress: () => {
              // Mark session as completed
              setSession(prev => ({
                ...prev!,
                completed: true,
                completedChunks: totalChunks,
                sessionProgress: 100,
              }));
              navigation.goBack();
            },
          },
        ]
      );
    }
  };

  const handlePreviousChunk = () => {
    if (currentChunkIndex > 0) {
      setCurrentChunkIndex(currentChunkIndex - 1);
      // Update session progress
      if (hasChunks) {
        setSession(prev => ({
          ...prev!,
          currentChunkIndex: currentChunkIndex - 1,
          sessionProgress: ((currentChunkIndex - 1) / totalChunks) * 100,
        }));
      }
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
            setSession(prev => ({
              ...prev!,
              completed: true,
              completedChunks: totalChunks,
              sessionProgress: 100,
            }));
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
        <View style={styles.titleContainer}>
          <View style={[styles.courseColorIndicator, { backgroundColor: course?.color || '#007AFF' }]} />
          <Text style={styles.title}>{course?.name || 'Study Session'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={[styles.card, { borderLeftColor: course?.color || '#007AFF', borderLeftWidth: 4 }] as any}>
          <CardHeader>
            <CardTitle style={styles.courseTitle}>
              <View style={styles.titleRow}>
                <View style={[styles.courseIcon, { backgroundColor: course?.color || '#007AFF' }]}>
                  <Ionicons name="book" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.courseTitleText}>{course?.name}</Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.sessionInfo}>
              Today's session • {hasChunks ? `${totalChunks} chunks` : `${totalChunks} slides`}
              {hasChunks && session.totalEstimatedTime && (
                <Text> • {Math.round(session.totalEstimatedTime)} min</Text>
              )}
            </Text>
            
            <View style={styles.progressContainer}>
              <ProgressBar
                value={hasChunks ? session.completedChunks + (currentChunkIndex > session.currentChunkIndex ? 1 : 0) : currentChunkIndex}
                max={totalChunks}
                showLabel
                size="lg"
              />
            </View>
          </CardContent>
        </Card>

        {/* AI-Generated Chunk Content */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>
              {hasChunks ? `Chunk ${currentChunkIndex + 1} of ${totalChunks}` : `Slide ${currentChunkIndex + 1} of ${totalChunks}`}
              {hasChunks && currentChunk && (
                <Text style={styles.chunkTime}> • {Math.round(currentChunk.estimatedTime)} min</Text>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.chunkContent}>
              <Text style={styles.chunkTitle}>
                {hasChunks && currentChunk ? currentChunk.title : `${course?.name} - Chapter ${Math.floor(currentChunkIndex / 4) + 1}`}
              </Text>
              
              {hasChunks && currentChunk ? (
                <>
                  {/* Main Content */}
                  <View style={styles.contentSection}>
                    <Text style={styles.contentText}>
                      {currentChunk.content[0]?.content || 'Content will be displayed here'}
                    </Text>
                  </View>
                  
                  {/* Learning Objectives */}
                  {currentChunk.learningObjectives && currentChunk.learningObjectives.length > 0 && (
                    <View style={styles.objectivesContainer}>
                      <Text style={styles.sectionTitle}>
                        <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                        <Text style={styles.sectionTitleText}> Learning Objectives</Text>
                      </Text>
                      {currentChunk.learningObjectives.map((objective, index) => (
                        <Text key={index} style={styles.objectiveText}>
                          • {objective}
                        </Text>
                      ))}
                    </View>
                  )}
                  
                  {/* Key Terms */}
                  {currentChunk.keywords && currentChunk.keywords.length > 0 && (
                    <View style={styles.keywordsContainer}>
                      <Text style={styles.sectionTitle}>
                        <Ionicons name="key" size={16} color="#007AFF" />
                        <Text style={styles.sectionTitleText}> Key Terms</Text>
                      </Text>
                      <View style={styles.keywordsList}>
                        {currentChunk.keywords.slice(0, 8).map((keyword, index) => (
                          <View key={index} style={styles.keywordTag}>
                            <Text style={styles.keywordText}>{keyword}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Assessment Questions */}
                  {currentChunk.assessmentQuestions && currentChunk.assessmentQuestions.length > 0 && (
                    <View style={styles.questionsContainer}>
                      <Text style={styles.sectionTitle}>
                        <Ionicons name="help-circle" size={16} color="#FF9500" />
                        <Text style={styles.sectionTitleText}> Review Questions</Text>
                      </Text>
                      {currentChunk.assessmentQuestions.slice(0, 3).map((question, index) => (
                        <Text key={index} style={styles.questionText}>
                          {index + 1}. {question}
                        </Text>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false}>
                  <MarkdownRenderer 
                    content={currentChunk?.content?.[0]?.content || 'No content available for this chunk.'} 
                    style={styles.markdownContent}
                  />
                </ScrollView>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <View style={styles.navigationButtons}>
          <Button
            title="Previous"
            onPress={handlePreviousChunk}
            variant="outline"
            disabled={currentChunkIndex === 0}
            style={styles.navButton}
          />
          
          <Button
            title={currentChunkIndex === totalChunks - 1 ? 'Complete' : 'Next'}
            onPress={currentChunkIndex === totalChunks - 1 ? handleCompleteSession : handleNextChunk}
            style={styles.navButton}
          />
        </View>

        {/* Study Tips */}
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
              • Review key concepts after each chunk
            </Text>
            <Text style={styles.tipText}>
              • Take notes to reinforce learning
            </Text>
            <Text style={styles.tipText}>
              • Answer the review questions to test understanding
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  courseColorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  courseTitleText: {
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
  chunkContent: {
    alignItems: 'flex-start',
  },
  chunkTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'left',
    width: '100%',
  },
  contentSection: {
    marginBottom: 20,
    width: '100%',
  },
  contentText: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
    textAlign: 'left',
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 6,
  },
  objectivesContainer: {
    marginBottom: 20,
    width: '100%',
  },
  objectiveText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 6,
    lineHeight: 20,
    paddingLeft: 8,
  },
  keywordsContainer: {
    marginBottom: 20,
    width: '100%',
  },
  keywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  keywordText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  questionsContainer: {
    marginBottom: 20,
    width: '100%',
  },
  questionText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 8,
    lineHeight: 20,
    paddingLeft: 8,
  },
  placeholderContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
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
  chunkTime: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: 'normal',
  },
  contentScrollView: {
    maxHeight: 400,
    marginVertical: 8,
  },
  markdownContent: {
    paddingHorizontal: 4,
  },
});
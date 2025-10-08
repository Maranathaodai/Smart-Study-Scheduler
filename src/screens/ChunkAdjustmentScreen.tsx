import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { StudyChunk, Course } from '../lib/types';
import { courseService } from '../lib/courseService';
import { Ionicons } from '@expo/vector-icons';

interface RouteParams {
  course: Course;
}

export default function ChunkAdjustmentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { course } = route.params as RouteParams;
  
  const [chunks, setChunks] = useState<StudyChunk[]>(course.processedChunks || []);
  const [selectedChunk, setSelectedChunk] = useState<StudyChunk | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'split' | 'merge' | 'resize'>('split');

  useEffect(() => {
    if (course.processedChunks) {
      setChunks(course.processedChunks);
    }
  }, [course.processedChunks]);

  const handleChunkSelect = (chunk: StudyChunk) => {
    setSelectedChunk(chunk);
    setShowAdjustmentModal(true);
  };

  const handleSplitChunk = async () => {
    if (!selectedChunk) return;

    try {
      const adjustedCourse = await courseService.adjustCourseChunks(course, [
        {
          chunkId: selectedChunk.id,
          action: 'split',
          parameters: { splitPoint: 0.5 }, // Split in the middle
        },
      ]);

      setChunks(adjustedCourse.processedChunks || []);
      setShowAdjustmentModal(false);
      Alert.alert('Success', 'Chunk has been split successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to split chunk. Please try again.');
    }
  };

  const handleMergeChunks = async () => {
    if (!selectedChunk) return;

    const chunkIndex = chunks.findIndex(c => c.id === selectedChunk.id);
    if (chunkIndex === -1 || chunkIndex >= chunks.length - 1) {
      Alert.alert('Error', 'Cannot merge with the last chunk.');
      return;
    }

    try {
      const adjustedCourse = await courseService.adjustCourseChunks(course, [
        {
          chunkId: selectedChunk.id,
          action: 'merge',
          parameters: { targetChunkId: chunks[chunkIndex + 1].id },
        },
      ]);

      setChunks(adjustedCourse.processedChunks || []);
      setShowAdjustmentModal(false);
      Alert.alert('Success', 'Chunks have been merged successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to merge chunks. Please try again.');
    }
  };

  const handleResizeChunk = async () => {
    if (!selectedChunk) return;

    // For demo purposes, we'll resize to 20 minutes
    try {
      const adjustedCourse = await courseService.adjustCourseChunks(course, [
        {
          chunkId: selectedChunk.id,
          action: 'resize',
          parameters: { newSize: 20 },
        },
      ]);

      setChunks(adjustedCourse.processedChunks || []);
      setShowAdjustmentModal(false);
      Alert.alert('Success', 'Chunk size has been adjusted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to resize chunk. Please try again.');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#34C759';
      case 'medium': return '#FF9500';
      case 'hard': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const renderAdjustmentModal = () => (
    <Modal
      visible={showAdjustmentModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Adjust Chunk</Text>
          <TouchableOpacity
            onPress={() => setShowAdjustmentModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Card style={styles.chunkInfoCard}>
            <CardHeader>
              <CardTitle>{selectedChunk?.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.chunkInfo}>
                Estimated Time: {selectedChunk?.estimatedTime} minutes
              </Text>
              <Text style={styles.chunkInfo}>
                Difficulty: {selectedChunk?.difficulty}
              </Text>
              <Text style={styles.chunkInfo}>
                Learning Objectives: {selectedChunk?.learningObjectives.length}
              </Text>
            </CardContent>
          </Card>

          <View style={styles.adjustmentButtons}>
            <Button
              title="Split Chunk"
              onPress={handleSplitChunk}
              variant="outline"
              style={styles.adjustmentButton}
            />
            
            <Button
              title="Merge with Next"
              onPress={handleMergeChunks}
              variant="outline"
              style={styles.adjustmentButton}
            />
            
            <Button
              title="Resize to 20 min"
              onPress={handleResizeChunk}
              variant="outline"
              style={styles.adjustmentButton}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>Adjust Study Chunks</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.summaryCard}>
          <CardHeader>
            <CardTitle>Course Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.summaryText}>
              Total Chunks: {chunks.length}
            </Text>
            <Text style={styles.summaryText}>
              Total Estimated Time: {Math.round(chunks.reduce((sum, chunk) => sum + chunk.estimatedTime, 0))} minutes
            </Text>
            <Text style={styles.summaryText}>
              Average Chunk Size: {Math.round(chunks.reduce((sum, chunk) => sum + chunk.estimatedTime, 0) / chunks.length)} minutes
            </Text>
          </CardContent>
        </Card>

        <Text style={styles.sectionTitle}>Study Chunks</Text>
        
        {chunks.map((chunk, index) => (
          <Card key={chunk.id} style={styles.chunkCard}>
            <TouchableOpacity
              onPress={() => handleChunkSelect(chunk)}
              style={styles.chunkTouchable}
            >
              <CardHeader>
                <View style={styles.chunkHeader}>
                  <View style={styles.chunkInfo}>
                    <Text style={styles.chunkTitle}>{chunk.title}</Text>
                    <Text style={styles.chunkOrder}>#{index + 1}</Text>
                  </View>
                  <View style={styles.chunkBadges}>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(chunk.difficulty) }]}>
                      <Text style={styles.difficultyText}>{chunk.difficulty}</Text>
                    </View>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeText}>{Math.round(chunk.estimatedTime)}m</Text>
                    </View>
                  </View>
                </View>
              </CardHeader>
              <CardContent>
                <Text style={styles.chunkDescription} numberOfLines={2}>
                  {chunk.content[0]?.content || 'No content available'}
                </Text>
                
                {chunk.learningObjectives && chunk.learningObjectives.length > 0 && (
                  <View style={styles.objectivesPreview}>
                    <Text style={styles.objectivesLabel}>Objectives:</Text>
                    <Text style={styles.objectivesText}>
                      {chunk.learningObjectives.slice(0, 2).join(', ')}
                      {chunk.learningObjectives.length > 2 && '...'}
                    </Text>
                  </View>
                )}

                {chunk.keywords && chunk.keywords.length > 0 && (
                  <View style={styles.keywordsPreview}>
                    {chunk.keywords.slice(0, 3).map((keyword, idx) => (
                      <View key={idx} style={styles.keywordTag}>
                        <Text style={styles.keywordText}>{keyword}</Text>
                      </View>
                    ))}
                    {chunk.keywords.length > 3 && (
                      <Text style={styles.moreKeywords}>+{chunk.keywords.length - 3} more</Text>
                    )}
                  </View>
                )}
              </CardContent>
            </TouchableOpacity>
          </Card>
        ))}

        <View style={styles.footer}>
          <Button
            title="Save Changes"
            onPress={() => {
              Alert.alert('Success', 'All changes have been saved!');
              navigation.goBack();
            }}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>

      {renderAdjustmentModal()}
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
  summaryCard: {
    marginBottom: 24,
  },
  summaryText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  chunkCard: {
    marginBottom: 16,
  },
  chunkTouchable: {
    // Remove default touchable styling
  },
  chunkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chunkInfo: {
    flex: 1,
  },
  chunkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  chunkOrder: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  chunkBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  timeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  chunkDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
  objectivesPreview: {
    marginBottom: 8,
  },
  objectivesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  objectivesText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  keywordsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  keywordTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  keywordText: {
    fontSize: 10,
    color: '#8E8E93',
  },
  moreKeywords: {
    fontSize: 10,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 24,
    marginBottom: 100,
  },
  saveButton: {
    marginBottom: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  chunkInfoCard: {
    marginBottom: 24,
  },
  adjustmentButtons: {
    gap: 16,
  },
  adjustmentButton: {
    marginBottom: 8,
  },
});

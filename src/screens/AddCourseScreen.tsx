import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { processingTracker, ProcessingProgress } from '../lib/processingTracker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, differenceInDays, addDays } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { courseService } from '../lib/courseService';
import { courseService as supabaseCourseService } from '../lib/supabaseCourseService';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { generateIntelligentSchedules, calculateAISessionCount } from '../lib/scheduler';
import { courseStorage } from '../lib/courseStorage';
import { Course, StudySession } from '../lib/types';

export default function AddCourseScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [courseName, setCourseName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [courseContent, setCourseContent] = useState('');
  
  // AI Processing States
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingDetails, setProcessingDetails] = useState<ProcessingProgress | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [aiGeneratedChunks, setAiGeneratedChunks] = useState<any[]>([]);
  const [maxStudyTimePerSession, setMaxStudyTimePerSession] = useState(60); // minutes
  const [preferredChunkSize, setPreferredChunkSize] = useState<'small' | 'medium' | 'large'>('medium');

  const categories = [
    'Mathematics',
    'Computer Science',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Literature',
    'Other',
  ];

  // Listen to processing progress updates
  React.useEffect(() => {
    const handleProgressUpdate = (progress: ProcessingProgress) => {
      setProcessingDetails(progress);
      setProcessingProgress(progress.progress);
      setProcessingStatus(progress.status);
    };

    const handleComplete = () => {
      setIsProcessingFiles(false);
      setProcessingDetails(null);
    };

    processingTracker.on('progress', handleProgressUpdate);
    processingTracker.on('complete', handleComplete);

    return () => {
      processingTracker.off('progress', handleProgressUpdate);
      processingTracker.off('complete', handleComplete);
    };
  }, []);

  const generateSmartSchedule = async () => {
    if (!course || !startDate || !endDate) {
      Alert.alert('Error', 'Please process content and set study dates first');
      return;
    }

    const totalDays = differenceInDays(endDate, startDate);
    
    if (totalDays <= 0) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    if (!course.processedChunks || course.processedChunks.length === 0) {
      Alert.alert('Error', 'No processed content available. Please process content first.');
      return;
    }

    try {
      setLoading(true);
      
      // Generate intelligent schedule using AI-processed chunks
      const schedule = generateIntelligentSchedules({
        courses: [course],
        startDate,
        endDate,
        studyDaysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
        maxStudyTimePerSession,
        preferredChunkSize,
      });

      // Save study sessions to local storage only (avoid database RLS issues)
      const savedSessions: StudySession[] = [];
      try {
        // Use the generated sessions directly
        for (const session of schedule.allSessions) {
          savedSessions.push(session);
        }
        // Save to local storage
        await courseStorage.saveStudySessions(savedSessions);
        console.log('✅ Successfully saved study sessions to local storage');
      } catch (sessionError) {
        console.error('❌ Failed to save sessions to local storage:', sessionError);
        Alert.alert('Error', 'Failed to save study sessions. Please try again.');
        return;
      }

      setStudySessions(savedSessions);
      setShowSchedule(true);
      
      Alert.alert(
        'Smart Schedule Generated! 🎉',
        `Created ${savedSessions.length} intelligent study sessions based on your course content.\n\nYour schedule has been saved!`,
        [
          {
            text: 'View Schedule',
            onPress: () => (navigation as any).navigate('StudySchedule', {
              course: {
                ...course,
                createdAt: course.createdAt.toISOString(), // Serialize Date to string
              },
              studySessions: savedSessions.map(session => ({
                ...session,
                date: session.date.toISOString(), // Serialize Date to string
              }))
            })
          }
        ]
      );
    } catch (error) {
      console.error('Error generating schedule:', error);
      Alert.alert('Error', 'Failed to generate smart schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processManualContentOnly = async () => {
    if (!courseName.trim() || !category) {
      Alert.alert('Error', 'Please enter course name and select category first');
      return;
    }

    if (!courseContent.trim()) {
      Alert.alert('Error', 'Please enter content in the manual input field');
      return;
    }

    try {
      setIsProcessingFiles(true);
      setProcessingProgress(0);
      setProcessingStatus('Creating course...');

      if (!user) {
        Alert.alert('Error', 'You must be logged in to create courses');
        return;
      }

      // Create course in database with unique color
      const uniqueColor = courseStorage.generateUniqueColor();
      const finalCategory = category === 'Other' ? customCategory : category;
      const newCourse = await supabaseCourseService.createCourse(
        courseName,
        finalCategory,
        'medium', // Default difficulty
        5, // Default priority
        uniqueColor, // Unique color
        user.id // User ID
      );

      setCourse(newCourse);
      setProcessingProgress(40);
      setProcessingStatus('Processing content with AI...');

      // Process manual content
      const processingResult = await courseService.processManualContent(courseContent, courseName);
      
      if (processingResult) {
        setProcessingProgress(80);
        setProcessingStatus('Generating study chunks...');
        
        // Update course with processed content
        const updatedCourse = {
          ...newCourse,
          processedChunks: processingResult.chunks,
          keyConcepts: processingResult.keyConcepts,
          totalEstimatedTime: processingResult.totalEstimatedTime,
          processingStatus: 'completed' as const,
        };
        
        // Save updated course to database
        await supabaseCourseService.updateCourse(newCourse.id, {
          processedChunks: processingResult.chunks,
          keyConcepts: processingResult.keyConcepts,
          totalEstimatedTime: processingResult.totalEstimatedTime,
          processingStatus: 'completed',
          lastProcessed: new Date(),
        });
        
        setCourse(updatedCourse);
        setAiGeneratedChunks(processingResult.chunks);
        
        setProcessingProgress(100);
        setProcessingStatus('Processing complete!');
        
        // Estimate number of sessions that will be generated
        const estimatedSessions = calculateAISessionCount([updatedCourse]);

        Alert.alert(
          'AI Processing Complete! 🎉',
          `Successfully processed your content into ${processingResult.chunks?.length || 0} intelligent study chunks.\n\nThis will generate approximately ${estimatedSessions} study sessions.\n\nTotal estimated study time: ${Math.round(processingResult.totalEstimatedTime || 0)} minutes\n\nYou can now create the course and generate the schedule separately.`,
          [
            {
              text: 'Great!',
              onPress: () => {
                setIsProcessingFiles(false);
                setProcessingProgress(0);
                setProcessingStatus('');
                // Don't automatically generate schedule - let user do it manually
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error processing manual content:', error);
      Alert.alert(
        'Processing Error',
        `Failed to process content: ${error.message}\n\nPlease try again or check your content.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setIsProcessingFiles(false);
              setProcessingProgress(0);
              setProcessingStatus('');
            }
          }
        ]
      );
    }
  };

  const shiftSession = (sessionId, direction) => {
    setStudySessions(prev => {
      const sessions = [...prev];
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) return prev;
      
      const session = sessions[sessionIndex];
      const newDate = new Date(session.date);
      
      if (direction === 'forward') {
        newDate.setDate(newDate.getDate() + 1);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
      
      // Check if the new date is within the allowed range
      if (newDate < startDate || newDate > endDate) {
        Alert.alert('Invalid Date', 'Session date must be within the study timeline');
        return prev;
      }
      
      // Check if another session already exists on this date
      const conflictingSession = sessions.find(s => 
        s.id !== sessionId && 
        s.date.toDateString() === newDate.toDateString()
      );
      
      if (conflictingSession) {
        Alert.alert('Date Conflict', 'Another session is already scheduled on this date');
        return prev;
      }
      
      sessions[sessionIndex] = {
        ...session,
        date: newDate
      };
      
      // Sort sessions by date
      return sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  };

  const toggleScheduleEditing = () => {
    setIsEditingSchedule(!isEditingSchedule);
  };

  const handleAddCourse = async () => {
    console.log('Add Course clicked');
    console.log('Course name:', courseName);
    console.log('Category:', category);
    console.log('Course:', course);
    console.log('Processing status:', course?.processingStatus);

    if (!courseName.trim() || !category) {
      Alert.alert('Error', 'Please fill in course name and category');
      return;
    }

    if (category === 'Other' && !customCategory.trim()) {
      Alert.alert('Error', 'Please enter a custom category');
      return;
    }

    if (!course || course.processingStatus !== 'completed') {
      Alert.alert('Error', 'Please process content first');
      return;
    }

    setLoading(true);
    
    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create courses');
        return;
      }

      // Save course to local storage (database saving can be added later)  
      try {
        // For now, just save to local storage to avoid RLS issues
        await courseStorage.addCourse(course);
        console.log('✅ Course saved to local storage');
      } catch (localError) {
        console.error('❌ Failed to save course to local storage:', localError);
        throw localError;
      }
      
      // Generate study sessions if they don't exist
      let sessionsToSave = studySessions;
      if (sessionsToSave.length === 0 && course.processedChunks && course.processedChunks.length > 0) {
        // Generate basic study sessions from processed chunks
        const generatedSessions = await generateIntelligentSchedules({
          courses: [course],
          startDate: startDate || new Date(),
          endDate: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
          studyDaysOfWeek: [1, 2, 3, 4, 5], // Default to weekdays
          maxStudyTimePerSession: maxStudyTimePerSession || 60,
          preferredChunkSize: preferredChunkSize || 'medium',
        });
        sessionsToSave = generatedSessions.allSessions;
        setStudySessions(generatedSessions.allSessions);
      }
      
      // Save study sessions to local storage (database saving can be added later)
      if (sessionsToSave.length > 0) {
        try {
          // For now, just save to local storage to avoid RLS issues
          await courseStorage.saveStudySessions(sessionsToSave);
          console.log('✅ Study sessions saved to local storage');
        } catch (localError) {
          console.error('❌ Failed to save sessions to local storage:', localError);
        }
      }
      
      setLoading(false);
      // Estimate final session count
      const finalEstimatedSessions = calculateAISessionCount([course]);

      Alert.alert(
        'Success! 🎉', 
        `Course "${courseName}" has been created successfully!\n\n• ${course.processedChunks?.length || 0} study chunks\n• Approximately ${finalEstimatedSessions} study sessions\n• Color: ${course.color}`,
        [
          { 
            text: 'View Course', 
            onPress: () => {
              // Navigate to courses screen
              navigation.navigate('Courses' as never);
            }
          },
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to add course. Please try again.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Add New Course</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Course Name"
              placeholder="Enter course name"
              value={courseName}
              onChangeText={setCourseName}
            />
            
            <Text style={styles.preferenceLabel}>Study Preferences</Text>
            
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceText}>Max Study Time per Session:</Text>
              <View style={styles.timeSelector}>
                {[30, 45, 60, 90].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeButton,
                      maxStudyTimePerSession === time && styles.selectedTimeButton,
                    ]}
                    onPress={() => setMaxStudyTimePerSession(time)}
                  >
                    <Text style={[
                      styles.timeButtonText,
                      maxStudyTimePerSession === time && styles.selectedTimeButtonText,
                    ]}>
                      {time}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceText}>Chunk Size Preference:</Text>
              <View style={styles.chunkSizeSelector}>
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.chunkSizeButton,
                      preferredChunkSize === size && styles.selectedChunkSizeButton,
                    ]}
                    onPress={() => setPreferredChunkSize(size)}
                  >
                    <Text style={[
                      styles.chunkSizeButtonText,
                      preferredChunkSize === size && styles.selectedChunkSizeButtonText,
                    ]}>
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <Text style={styles.categoryLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.selectedCategory,
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    if (cat !== 'Other') {
                      setCustomCategory('');
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.selectedCategoryText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {category === 'Other' && (
              <View style={styles.customCategoryContainer}>
                <Text style={styles.customCategoryLabel}>Custom Category</Text>
                <Input
                  placeholder="Enter your custom category"
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  style={styles.customCategoryInput}
                />
              </View>
            )}
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Course Content</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Manual Content Input */}
            <View style={styles.contentInputContainer}>
              <Text style={styles.contentInputLabel}>
                📝 Course Content Input:
              </Text>
              <Text style={[styles.contentInputSubtext, { color: colors.textSecondary }]}>
                Paste your course content here. You can copy text from your PDFs, documents, or any study materials to create AI-powered study chunks.
              </Text>
              <Input
                label="Course Content"
                placeholder="Paste your course content here..."
                value={courseContent}
                onChangeText={setCourseContent}
                multiline
                numberOfLines={8}
                style={styles.contentInput}
              />
              <Text style={styles.contentInputHint}>
                This content will be processed by AI to create optimized study chunks and learning objectives.
              </Text>
              
              {courseContent.trim() && (!course || course.processingStatus !== 'completed') && (
                <Button
                  title="Process Content with AI"
                  onPress={() => processManualContentOnly()}
                  loading={isProcessingFiles}
                  style={styles.processButton}
                />
              )}
            </View>
            
            {course && course.processingStatus === 'completed' && (
              <View style={styles.processingCompleteContainer}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                </View>
                <View style={styles.processingCompleteInfo}>
                  <Text style={styles.processingCompleteTitle}>
                    AI Processing Complete! 🎉
                  </Text>
                  <Text style={styles.processingCompleteText}>
                    Generated {course.processedChunks?.length || 0} intelligent study chunks
                  </Text>
                  <Text style={styles.processingCompleteText}>
                    Total estimated time: {Math.round(course.totalEstimatedTime || 0)} minutes
                  </Text>
                  {course.keyConcepts && course.keyConcepts.length > 0 && (
                    <View style={styles.keyConceptsContainer}>
                      <Text style={styles.keyConceptsTitle}>Key Concepts:</Text>
                      <View style={styles.keyConceptsList}>
                        {course.keyConcepts.slice(0, 5).map((concept, index) => (
                          <View key={index} style={styles.keyConceptTag}>
                            <Text style={styles.keyConceptText}>{concept}</Text>
                          </View>
                        ))}
                        {course.keyConcepts.length > 5 && (
                          <Text style={styles.moreConcepts}>
                            +{course.keyConcepts.length - 5} more
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Study Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.dateLabel}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {format(startDate, 'MMM dd, yyyy')}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            
            {showStartDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowStartDatePicker(false);
                    if (selectedDate) {
                      setStartDate(selectedDate);
                    }
                  }}
                />
              </View>
            )}

            <Text style={styles.dateLabel}>End Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {format(endDate, 'MMM dd, yyyy')}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            
            {showEndDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowEndDatePicker(false);
                    if (selectedDate) {
                      setEndDate(selectedDate);
                    }
                  }}
                />
              </View>
            )}

            {course && course.processingStatus === 'completed' && (
              <Button
                title="Generate Smart Schedule"
                onPress={generateSmartSchedule}
                variant="outline"
                style={styles.scheduleButton}
              />
            )}
          </CardContent>
        </Card>

        {showSchedule && (
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.scheduleHeader}>
                <CardTitle>Your Smart Study Schedule</CardTitle>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={toggleScheduleEditing}
                >
                  <Ionicons 
                    name={isEditingSchedule ? "checkmark" : "create-outline"} 
                    size={20} 
                    color="#007AFF" 
                  />
                  <Text style={styles.editButtonText}>
                    {isEditingSchedule ? 'Done' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </CardHeader>
            <CardContent>
              <Text style={styles.scheduleInfo}>
                {studySessions.length} study sessions planned from {format(startDate, 'MMM dd')} to {format(endDate, 'MMM dd, yyyy')}
              </Text>
              {isEditingSchedule && (
                <View style={styles.editingInfo}>
                  <Ionicons name="information-circle" size={16} color="#007AFF" />
                  <Text style={styles.editingInfoText}>
                    Tap the arrows to shift sessions by one day
                  </Text>
                </View>
              )}
              <ScrollView style={styles.scheduleList} showsVerticalScrollIndicator={false}>
                {studySessions.map((session, index) => (
                  <View key={session.id} style={styles.sessionItem}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionDate}>
                        {format(session.date, 'MMM dd, yyyy')}
                      </Text>
                      <Text style={styles.sessionSlides}>
                        {session.slides} slides
                      </Text>
                    </View>
                    <View style={styles.sessionActions}>
                      <View style={styles.sessionNumber}>
                        <Text style={styles.sessionNumberText}>
                          Day {index + 1}
                        </Text>
                      </View>
                      {isEditingSchedule && (
                        <View style={styles.shiftButtons}>
                          <TouchableOpacity 
                            style={[styles.shiftButton, styles.shiftButtonLeft]}
                            onPress={() => shiftSession(session.id, 'backward')}
                          >
                            <Ionicons name="chevron-back" size={16} color="#007AFF" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.shiftButton, styles.shiftButtonRight]}
                            onPress={() => shiftSession(session.id, 'forward')}
                          >
                            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </CardContent>
          </Card>
        )}

        <Button
          title="Add Course"
          onPress={handleAddCourse}
          loading={loading}
          style={styles.addButton}
          disabled={!course || course.processingStatus !== 'completed'}
        />
      </View>

    </ScrollView>
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
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 12,
    marginTop: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  customCategoryContainer: {
    marginTop: 16,
  },
  customCategoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  customCategoryInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  editingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  editingInfoText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    flex: 1,
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftButtons: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  shiftButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  shiftButtonLeft: {
    marginRight: 4,
  },
  shiftButtonRight: {
    marginLeft: 4,
  },
  addButton: {
    marginTop: 24,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
    marginTop: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  datePickerContainer: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#000000',
  },
  scheduleButton: {
    marginTop: 16,
  },
  scheduleInfo: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
    textAlign: 'center',
  },
  scheduleList: {
    maxHeight: 200,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  sessionSlides: {
    fontSize: 14,
    color: '#8E8E93',
  },
  sessionNumber: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sessionNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 12,
    marginTop: 16,
  },
  preferenceRow: {
    marginBottom: 16,
  },
  preferenceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  timeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  selectedTimeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  selectedTimeButtonText: {
    color: '#FFFFFF',
  },
  chunkSizeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  chunkSizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  selectedChunkSizeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chunkSizeButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  selectedChunkSizeButtonText: {
    color: '#FFFFFF',
  },
  processingContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  processingStatus: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  processingCompleteContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 12,
  },
  processingCompleteInfo: {
    alignItems: 'center',
  },
  processingCompleteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  processingCompleteText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
    textAlign: 'center',
  },
  keyConceptsContainer: {
    marginTop: 12,
    width: '100%',
  },
  keyConceptsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  keyConceptsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  keyConceptTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  keyConceptText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  moreConcepts: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  contentInputContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  contentInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  contentInputSubtext: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  contentInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  contentInputHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  processButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
  },
});

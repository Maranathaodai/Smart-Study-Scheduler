import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
// Removed dummy data imports
import { generateSchedules } from '../lib/scheduler';
import { generateIntelligentSchedules } from '../lib/scheduler';
import { courseService as supabaseCourseService } from '../lib/supabaseCourseService';
import { courseStorage } from '../lib/courseStorage';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { Course } from '../lib/types';

export default function CoursesScreen() {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { deleteCourse: deleteCourseFromProgress, refreshProgress } = useProgress();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load courses when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadCourses();
      refreshProgress(); // Also refresh progress data
    }, []) // Remove refreshProgress dependency to prevent infinite loops
  );

  const loadCourses = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.log('No user logged in, skipping courses load');
        return;
      }

      // Load courses from both local storage and database
      const [localCourses, databaseCourses] = await Promise.allSettled([
        courseStorage.loadCourses(),
        supabaseCourseService.getCourses(user.id)
      ]);

      const allCourses: Course[] = [];

      // Add local courses
      if (localCourses.status === 'fulfilled') {
        allCourses.push(...localCourses.value);
        console.log(`Loaded ${localCourses.value.length} courses from local storage`);
      } else {
        console.error('Error loading local courses:', localCourses.reason);
      }

      // Add database courses (avoid duplicates)
      if (databaseCourses.status === 'fulfilled') {
        const existingIds = new Set(allCourses.map(course => course.id));
        const uniqueDatabaseCourses = databaseCourses.value.filter(course => !existingIds.has(course.id));
        allCourses.push(...uniqueDatabaseCourses);
        console.log(`Loaded ${databaseCourses.value.length} courses from database (${uniqueDatabaseCourses.length} unique)`);
      } else {
        console.error('Error loading database courses:', databaseCourses.reason);
      }

      setCourses(allCourses);
      console.log(`Total courses loaded: ${allCourses.length}`);
    } catch (error) {
      console.error('Error loading courses:', error);
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const deleteCourse = async (course: Course) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${course.name}"? This action cannot be undone and will also delete all associated study sessions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete course from both local storage and database
              const deleteOperations = [
                courseStorage.deleteCourse(course.id),
                supabaseCourseService.deleteCourse(course.id)
              ];
              
              // Execute both deletions, but don't fail if one fails
              const results = await Promise.allSettled(deleteOperations);
              
              // Log results for debugging
              if (results[0].status === 'fulfilled') {
                console.log('✅ Course deleted from local storage');
              } else {
                console.error('❌ Failed to delete from local storage:', results[0].reason);
              }
              
              if (results[1].status === 'fulfilled') {
                console.log('✅ Course deleted from database');
              } else {
                console.error('❌ Failed to delete from database:', results[1].reason);
              }
              
              // Update progress context to remove sessions for this course
              deleteCourseFromProgress(course.id);
              
              // Reload courses to update UI
              await loadCourses();
              
              Alert.alert('Success', 'Course deleted successfully');
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert('Error', 'Failed to delete course. Please try again.');
            }
          }
        },
      ]
    );
  };

  const generateStudySessions = async (course) => {
    try {
      console.log('🔍 Looking for study sessions for course:', course.name, course.id);
      
      // First try to load from database (will work once RLS is fixed)
      try {
        const courseSessions = await supabaseCourseService.getStudySessions(course.id);
        if (courseSessions.length > 0) {
          console.log('✅ Found', courseSessions.length, 'sessions in database');
          return courseSessions;
        }
      } catch (dbError) {
        console.warn('⚠️ Database session lookup failed:', dbError);
      }
      
      // Then try to load from local storage
      try {
        const localSessions = await courseStorage.loadStudySessions();
        const courseSessions = localSessions.filter(session => session.courseId === course.id);
        if (courseSessions.length > 0) {
          console.log('✅ Found', courseSessions.length, 'sessions in local storage');
          return courseSessions;
        }
      } catch (localError) {
        console.warn('⚠️ Local session lookup failed:', localError);
      }

      // If course has AI-processed chunks, generate sessions from them
      if (course.processedChunks && course.processedChunks.length > 0) {
        console.log('🧠 Generating sessions from', course.processedChunks.length, 'AI chunks');
        
        const startDate = new Date();
        const endDate = new Date(Date.now() + 21*86400000); // 21 days from now
        
        const generatedSchedule = await generateIntelligentSchedules({
          courses: [course],
          startDate,
          endDate,
          studyDaysOfWeek: [1,2,3,4,5], // Monday to Friday
          maxStudyTimePerSession: 60, // 60 minutes
          preferredChunkSize: 'medium',
        });
        
        if (generatedSchedule.allSessions.length > 0) {
          console.log('✅ Generated', generatedSchedule.allSessions.length, 'new sessions');
          // Save to local storage
          await courseStorage.saveStudySessions(generatedSchedule.allSessions);
          return generatedSchedule.allSessions;
        }
      }

      // Last resort: use old scheduler if course has slides
      if (course.totalSlides > 0) {
        console.log('📝 Falling back to slide-based generation for', course.totalSlides, 'slides');
        const startDate = new Date();
        const endDate = new Date(Date.now() + 21*86400000); // 21 days from now
        const studyDaysOfWeek = [1,2,3,4,5]; // Monday to Friday
        const maxSlidesPerSession = 15;

        const { byCourse } = generateSchedules({
          courses: [course],
          startDate,
          endDate,
          studyDaysOfWeek,
          maxSlidesPerSession,
        });

        return byCourse[course.id] || [];
      }

      console.log('❌ No way to generate sessions - no chunks and no slides');
      return [];
    } catch (error) {
      console.error('Error loading study sessions:', error);
      return [];
    }
  };

  const renderCourse = ({ item: course }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => {
        // Navigate to course detail
        Alert.alert(
          'Course Details',
          `${course.name}\n\nCategory: ${course.category}\nFiles: ${course.files?.length || 0}\nProgress: ${course.totalSlides > 0 ? Math.round((course.completedSlides / course.totalSlides) * 100) : 0}%\n\nWould you like to start studying this course?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Start Studying', 
              onPress: async () => {
                const sessions = await generateStudySessions(course);
                if (sessions.length > 0) {
                  (navigation as any).navigate('DailyStudy', {
                    course: {
                      ...course,
                      createdAt: course.createdAt.toISOString(), // Serialize Date to string
                    },
                    session: sessions[0] // Use first session for now
                  });
                } else {
                  Alert.alert('No Sessions', 'No study sessions available for this course.');
                }
              }
            },
          ]
        );
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle style={styles.courseTitle}>
            <View style={styles.titleRow}>
              <View style={[styles.categoryBadge, { backgroundColor: course.color }]}>
                <Text style={[styles.categoryText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>{course.category}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Course Options',
                    `What would you like to do with "${course.name}"?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Delete Course', 
                        style: 'destructive',
                        onPress: () => deleteCourse(course)
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={[styles.courseName, { color: colors.text }]}>{course.name}</Text>
          <Text style={[styles.fileCount, { color: colors.textSecondary }]}>
            {course.files?.length || 0} file{(course.files?.length || 0) !== 1 ? 's' : ''} uploaded
          </Text>
          
          <View style={styles.progressContainer}>
            <ProgressBar
              value={course.completedSlides}
              max={course.totalSlides}
              showLabel
              size="md"
            />
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{course.completedSlides}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{course.totalSlides - course.completedSlides}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {course.totalSlides > 0 ? Math.round((course.completedSlides / course.totalSlides) * 100) : 0}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Progress</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: course.color }]}
              onPress={async () => {
                const rawSessions = await generateStudySessions(course);
                if (rawSessions && rawSessions.length > 0) {
                  const studySessions = rawSessions.map(s => ({ ...s, date: s.date.toISOString() }));
                  (navigation as any).navigate('StudySchedule', { 
                    course: {
                      ...course,
                      createdAt: course.createdAt.toISOString(), // Serialize Date to string
                    }, 
                    studySessions 
                  });
                } else {
                  Alert.alert('No Sessions', 'No study sessions available for this course.');
                }
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Study Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={async () => {
                console.log('🎯 Start Study button clicked for course:', course.name);
                const sessions = await generateStudySessions(course);
                console.log('🎯 Sessions found:', sessions.length);
                if (sessions.length > 0) {
                  console.log('🎯 First session details:');
                  console.log('  - ID:', sessions[0].id);
                  console.log('  - Date:', sessions[0].date);
                  console.log('  - Chunks:', sessions[0].chunks?.length || 0);
                  console.log('  - Total time:', sessions[0].totalEstimatedTime || 0, 'minutes');
                  
                  // Debug: Show all sessions
                  sessions.forEach((session, index) => {
                    console.log(`📚 Session ${index + 1}:`, {
                      id: session.id,
                      chunks: session.chunks?.length || 0,
                      time: session.totalEstimatedTime || 0,
                      date: session.date
                    });
                  });
                  
                  console.log('🎯 Navigating to DailyStudy with session:', sessions[0].id);
                  console.log('🔍 Session date type:', typeof sessions[0].date, sessions[0].date);
                  console.log('🔍 Course createdAt type:', typeof course.createdAt, course.createdAt);
                  try {
                    const sessionToNavigate = {
                      ...sessions[0],
                      date: sessions[0].date instanceof Date 
                        ? sessions[0].date.toISOString() 
                        : typeof sessions[0].date === 'string' 
                          ? sessions[0].date 
                          : new Date().toISOString(), // Fallback to current date
                      chunks: sessions[0].chunks || [], // Ensure chunks is always an array
                    };
                    
                    const courseToNavigate = {
                      ...course,
                      createdAt: course.createdAt instanceof Date 
                        ? course.createdAt.toISOString() 
                        : typeof course.createdAt === 'string' 
                          ? course.createdAt 
                          : new Date().toISOString(), // Fallback to current date
                    };
                    
                    (navigation as any).navigate('DailyStudy', {
                      course: courseToNavigate,
                      session: sessionToNavigate
                    });
                    console.log('🎯 Navigation call completed');
                  } catch (navError) {
                    console.error('❌ Navigation error:', navError);
                    Alert.alert('Navigation Error', 'Failed to navigate to study session. Please try again.');
                  }
                } else {
                  console.log('❌ No sessions found for course');
                  Alert.alert('No Sessions', 'No study sessions available for this course.');
                }
              }}
            >
              <Ionicons name="play-outline" size={16} color={course.color} />
              <Text style={[styles.actionButtonText, { color: course.color }]}>Start Study</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={async () => {
                const sessions = await generateStudySessions(course);
                if (sessions.length > 0) {
                  Alert.alert(
                    'Study Sessions Available',
                    `You have ${sessions.length} study sessions for this course.\n\nTotal study time: ${Math.round(sessions.reduce((sum, s) => sum + (s.totalEstimatedTime || 0), 0))} minutes\n\nWould you like to see all sessions?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'View All Sessions', 
                        onPress: async () => {
                          const studySessions = sessions.map(s => ({ 
                            ...s, 
                            date: s.date instanceof Date ? s.date.toISOString() : s.date 
                          }));
                          (navigation as any).navigate('StudySchedule', { 
                            course: {
                              ...course,
                              createdAt: course.createdAt instanceof Date ? course.createdAt.toISOString() : course.createdAt,
                            }, 
                            studySessions 
                          });
                        }
                      }
                    ]
                  );
                } else {
                  Alert.alert('No Sessions', 'No study sessions available for this course.');
                }
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>View Sessions</Text>
            </TouchableOpacity>
          </View>
          
          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: colors.error }]}
            onPress={() => deleteCourse(course)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete Course</Text>
          </TouchableOpacity>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Courses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddCourse' as never)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading courses...</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          renderItem={renderCourse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={64} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No courses yet</Text>
              <Text style={styles.emptyDescription}>
                Add your first course to get started with AI-powered study scheduling
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AddCourse' as never)}
              >
                <Text style={styles.emptyButtonText}>Add Course</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  courseCard: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 0,
  },
  courseTitle: {
    marginBottom: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  fileCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

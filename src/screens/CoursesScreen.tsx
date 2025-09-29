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
import { courseStorage } from '../lib/courseStorage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useProgress } from '../contexts/ProgressContext';
import { Course } from '../lib/types';

export default function CoursesScreen() {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { user } = useUser();
  const { deleteCourse: deleteCourseFromProgress } = useProgress();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load courses when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadCourses();
    }, [])
  );

  const loadCourses = async () => {
    try {
      setLoading(true);
      const loadedCourses = await courseStorage.loadCourses();
      setCourses(loadedCourses);
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
              // Delete course from storage
              await courseStorage.deleteCourse(course.id);
              
              // Delete associated study sessions
              const allSessions = await courseStorage.loadStudySessions();
              const remainingSessions = allSessions.filter(session => session.courseId !== course.id);
              await courseStorage.saveStudySessions(remainingSessions);
              
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
      // Load study sessions from storage
      const allSessions = await courseStorage.loadStudySessions();
      const courseSessions = allSessions.filter(session => session.courseId === course.id);
      
      if (courseSessions.length > 0) {
        return courseSessions;
      }
      
      // If no sessions found, generate them using the scheduler
      const startDate = user.preferences.scheduleStartDate ? new Date(user.preferences.scheduleStartDate) : new Date();
      const endDate = user.preferences.scheduleEndDate ? new Date(user.preferences.scheduleEndDate) : new Date(Date.now() + 21*86400000);
      const studyDaysOfWeek = user.preferences.studyDays ?? [1,2,3,4,5];
      const maxSlidesPerSession = user.preferences.maxSlidesPerSession ?? 15;

      const { byCourse } = generateSchedules({
        courses: courses,
        startDate,
        endDate,
        studyDaysOfWeek,
        maxSlidesPerSession,
      });

      return byCourse[course.id] || [];
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
          `${course.name}\n\nCategory: ${course.category}\nFiles: ${course.files.length}\nProgress: ${course.totalSlides > 0 ? Math.round((course.completedSlides / course.totalSlides) * 100) : 0}%\n\nWould you like to start studying this course?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Start Studying', 
              onPress: async () => {
                const sessions = await generateStudySessions(course);
                if (sessions.length > 0) {
                  (navigation as any).navigate('DailyStudy', {
                    course: course,
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
            {course.files.length} file{course.files.length !== 1 ? 's' : ''} uploaded
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
                  (navigation as any).navigate('StudySchedule', { course, studySessions });
                } else {
                  Alert.alert('No Sessions', 'No study sessions available for this course.');
                }
              }}
            >
              <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Study Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={async () => {
                const sessions = await generateStudySessions(course);
                if (sessions.length > 0) {
                  (navigation as any).navigate('DailyStudy', {
                    course: course,
                    session: sessions[0] // Use first session for now
                  });
                } else {
                  Alert.alert('No Sessions', 'No study sessions available for this course.');
                }
              }}
            >
              <Ionicons name="play-outline" size={16} color={course.color} />
              <Text style={[styles.actionButtonText, { color: course.color }]}>Start Study</Text>
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

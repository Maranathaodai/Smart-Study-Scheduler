import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { dummyCourses } from '../lib/dummy-data';
import { generateSchedules } from '../lib/scheduler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';

export default function CoursesScreen() {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { user } = useUser();

  const generateStudySessions = (course) => {
    const startDate = user.preferences.scheduleStartDate ? new Date(user.preferences.scheduleStartDate) : new Date();
    const endDate = user.preferences.scheduleEndDate ? new Date(user.preferences.scheduleEndDate) : new Date(Date.now() + 21*86400000);
    const studyDaysOfWeek = user.preferences.studyDays ?? [1,2,3,4,5];
    const maxSlidesPerSession = user.preferences.maxSlidesPerSession ?? 15;

    const { byCourse } = generateSchedules({
      courses: dummyCourses,
      startDate,
      endDate,
      studyDaysOfWeek,
      maxSlidesPerSession,
    });

    return byCourse[course.id] || [];
  };

  const renderCourse = ({ item: course }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => {
        // Navigate to course detail
        Alert.alert(
          'Course Details',
          `${course.name}\n\nCategory: ${course.category}\nFiles: ${course.files.length}\nProgress: ${Math.round((course.completedSlides / course.totalSlides) * 100)}%\n\nWould you like to start studying this course?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Start Studying', onPress: () => navigation.navigate('DailyStudy' as never) },
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
              <TouchableOpacity>
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
                {Math.round((course.completedSlides / course.totalSlides) * 100)}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Progress</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: course.color }]}
              onPress={() => {
                const rawSessions = generateStudySessions(course);
                const studySessions = rawSessions.map(s => ({ ...s, date: s.date.toISOString() }));
                (navigation as any).navigate('StudySchedule', { course, studySessions });
              }}
            >
              <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Study Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => (navigation as any).navigate('DailyStudy', { course })}
            >
              <Ionicons name="play-outline" size={16} color={course.color} />
              <Text style={[styles.actionButtonText, { color: course.color }]}>Start Study</Text>
            </TouchableOpacity>
          </View>
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

      <FlatList
        data={dummyCourses}
        renderItem={renderCourse}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyTitle}>No courses yet</Text>
            <Text style={styles.emptyDescription}>
              Add your first course to get started with your study schedule
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
});

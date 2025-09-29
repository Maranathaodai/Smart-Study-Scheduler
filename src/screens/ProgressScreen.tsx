import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
// Removed dummy data imports
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const { colors } = useTheme();
  const { weeklyProgress, overallProgress, courseProgress } = useProgress();
  const [achievementAnimations] = useState({
    firstSteps: new Animated.Value(1),
    streakMaster: new Animated.Value(1),
    dedicatedLearner: new Animated.Value(1),
  });

  const animateAchievement = (achievementKey: string) => {
    const animation = achievementAnimations[achievementKey];
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAchievementPress = (achievementKey: string, title: string, description: string) => {
    animateAchievement(achievementKey);
    Alert.alert(
      `🏆 ${title}`,
      description,
      [{ text: 'Awesome!', style: 'default' }]
    );
  };


  const [selectedDay, setSelectedDay] = useState<{ day: string; completed: number; total: number } | null>(null);
  const [isDayModalVisible, setIsDayModalVisible] = useState(false);

  const openDayModal = (dayData: { day: string; completed: number; total: number }) => {
    setSelectedDay(dayData);
    setIsDayModalVisible(true);
  };

  const closeDayModal = () => {
    setIsDayModalVisible(false);
    setSelectedDay(null);
  };


  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Progress Overview</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track your learning journey</Text>
      </View>

      <View style={styles.content}>
        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressBar
              value={overallProgress.completedSessions}
              max={overallProgress.totalSessions}
              showLabel
              size="lg"
            />
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{overallProgress.completedSessions}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{overallProgress.totalSessions - overallProgress.completedSessions}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions Remaining</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {Math.round(overallProgress.completionPercentage)}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Complete</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle>This Week's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.weeklyChart}>
              {weeklyProgress.map((day, index) => (
                <View key={day.day} style={styles.dayColumn}>
                  <View style={styles.barContainer}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => openDayModal(day)}
                      onLongPress={() => openDayModal(day)}
                    >
                      <View
                        style={[
                          styles.bar,
                          {
                            height: (day.completed / day.total) * 60,
                            backgroundColor: day.completed === day.total ? '#34C759' : '#007AFF',
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{day.day}</Text>
                  <Text style={[styles.dayStats, { color: colors.textSecondary }]}>
                    {day.completed}/{day.total}
                  </Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Day Detail Modal */}
        <Modal
          visible={isDayModalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeDayModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedDay ? `${selectedDay.day} Activity` : 'Activity'}
                </Text>
                <TouchableOpacity onPress={closeDayModal} style={styles.modalClose}>
                  <Ionicons name="close" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>
              {selectedDay && (
                <View style={styles.modalContent}>
                  <Text style={[styles.modalStat, { color: colors.text }]}>
                    {selectedDay.completed} of {selectedDay.total} sessions completed
                  </Text>
                  <View style={styles.modalBarArea}>
                    <View style={styles.modalBarTrack}>
                      <View
                        style={[
                          styles.modalBarFill,
                          { width: `${selectedDay.total > 0 ? (selectedDay.completed / selectedDay.total) * 100 : 0}%` },
                        ]}
                      />
                    </View>
                    <Text style={[styles.modalPercent, { color: colors.text }]}>
                      {selectedDay.total > 0 ? Math.round((selectedDay.completed / selectedDay.total) * 100) : 0}%
                    </Text>
                  </View>
                  <View style={styles.modalLegend}>
                    <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Completed</Text>
                    <View style={[styles.legendDot, { backgroundColor: '#007AFF', marginLeft: 16 }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Planned</Text>
                  </View>
                  <TouchableOpacity style={styles.modalButton} onPress={closeDayModal}>
                    <Text style={styles.modalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {courseProgress.map((course, index) => (
              <View key={course.courseId} style={styles.courseProgressItem}>
                <View style={styles.courseInfo}>
                  <Text style={[styles.courseName, { color: colors.text }]}>{course.courseName}</Text>
                  <Text style={[styles.courseCategory, { color: colors.textSecondary }]}>
                    {course.completedSessions}/{course.totalSessions} sessions
                  </Text>
                </View>
                <View style={styles.courseProgress}>
                  <ProgressBar
                    value={course.completedSessions}
                    max={course.totalSessions}
                    size="sm"
                  />
                  <Text style={[styles.coursePercentage, { color: colors.text }]}>
                    {Math.round(course.progressPercentage)}%
                  </Text>
                </View>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.achievementsGrid}>
              <TouchableOpacity 
                style={styles.achievement}
                onPress={() => handleAchievementPress('firstSteps', 'First Steps', 'Complete your first session')}
                activeOpacity={0.7}
              >
                <Animated.View style={{ transform: [{ scale: achievementAnimations.firstSteps }] }}>
                  <Ionicons name="trophy" size={32} color="#FFD700" />
                </Animated.View>
                <Text style={[styles.achievementTitle, { color: colors.text }]}>First Steps</Text>
                <Text style={[styles.achievementDesc, { color: colors.textSecondary }]}>Complete your first session</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.achievement}
                onPress={() => handleAchievementPress('streakMaster', 'Streak Master', 'Study for 7 days straight')}
                activeOpacity={0.7}
              >
                <Animated.View style={{ transform: [{ scale: achievementAnimations.streakMaster }] }}>
                  <Ionicons name="flame" size={32} color="#FF6B35" />
                </Animated.View>
                <Text style={[styles.achievementTitle, { color: colors.text }]}>Streak Master</Text>
                <Text style={[styles.achievementDesc, { color: colors.textSecondary }]}>Study for 7 days straight</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.achievement}
                onPress={() => handleAchievementPress('dedicatedLearner', 'Dedicated Learner', 'Complete 50 slides')}
                activeOpacity={0.7}
              >
                <Animated.View style={{ transform: [{ scale: achievementAnimations.dedicatedLearner }] }}>
                  <Ionicons name="star" size={32} color="#007AFF" />
                </Animated.View>
                <Text style={[styles.achievementTitle, { color: colors.text }]}>Dedicated Learner</Text>
                <Text style={[styles.achievementDesc, { color: colors.textSecondary }]}>Complete 50 slides</Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* Study Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Study Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <TouchableOpacity 
              style={styles.insightItem}
              onPress={() => Alert.alert('Peak Study Time', 'You\'re most productive between 2-4 PM. This is based on your study patterns over the last month.')}
              activeOpacity={0.7}
            >
              <Ionicons name="time" size={24} color="#007AFF" />
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>Peak Study Time</Text>
                <Text style={[styles.insightDesc, { color: colors.textSecondary }]}>You're most productive between 2-4 PM</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.insightItem}
              onPress={() => Alert.alert('Consistency Score', '85% - Great job maintaining your routine! You\'ve been consistent with your study schedule. Keep it up!')}
              activeOpacity={0.7}
            >
              <Ionicons name="trending-up" size={24} color="#34C759" />
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>Consistency Score</Text>
                <Text style={[styles.insightDesc, { color: colors.textSecondary }]}>85% - Great job maintaining your routine!</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.insightItem}
              onPress={() => Alert.alert('Study Recommendation', 'Try studying in 25-minute focused sessions (Pomodoro Technique). This can help improve your concentration and retention.')}
              activeOpacity={0.7}
            >
              <Ionicons name="bulb" size={24} color="#FF9500" />
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>Recommendation</Text>
                <Text style={[styles.insightDesc, { color: colors.textSecondary }]}>Try studying in 25-minute focused sessions</Text>
              </View>
            </TouchableOpacity>
          </CardContent>
        </Card>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 60,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  dayStats: {
    fontSize: 10,
    color: '#8E8E93',
  },
  courseProgressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  courseCategory: {
    fontSize: 12,
    color: '#8E8E93',
  },
  courseProgress: {
    flex: 1,
    alignItems: 'flex-end',
  },
  coursePercentage: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  achievementsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  achievement: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 4,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  insightDesc: {
    fontSize: 12,
    color: '#8E8E93',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  modalClose: {
    padding: 8,
  },
  modalContent: {
    paddingTop: 8,
  },
  modalStat: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 16,
  },
  modalBarArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalBarTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginRight: 12,
  },
  modalBarFill: {
    height: 12,
    backgroundColor: '#34C759',
    borderRadius: 6,
  },
  modalPercent: {
    width: 44,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
  },
  modalLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

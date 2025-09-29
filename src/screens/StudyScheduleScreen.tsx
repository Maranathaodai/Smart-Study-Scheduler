import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isPast, isFuture, addDays } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';

export default function StudyScheduleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { course, studySessions } = (route.params as any) || {};
  const initialSessions = (studySessions || []).map((s: any) => ({
    ...s,
    date: typeof s.date === 'string' ? new Date(s.date) : s.date,
  }));
  const [sessions, setSessions] = useState(initialSessions);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationScale] = useState(new Animated.Value(0));
  const [celebrationOpacity] = useState(new Animated.Value(0));
  
  const totalSlides = sessions.reduce((acc, session) => acc + session.slides, 0);
  const completedSlides = sessions.reduce((acc, session) => acc + session.completedSlides, 0);
  const completedSessions = sessions.filter(session => session.completed).length;

  const handleStartSession = (session) => {
    if (isFuture(session.date) && !isToday(session.date)) {
      Alert.alert('Not Yet', 'This session is scheduled for a future date.');
      return;
    }
    
    // Navigate to study session
    (navigation as any).navigate('DailyStudy', { session, course });
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    Animated.parallel([
      Animated.spring(celebrationScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(celebrationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after 3 seconds
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(celebrationScale, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowCelebration(false);
      });
    }, 3000);
  };

  const handleMarkComplete = (sessionId) => {
    setSessions(prevSessions => {
      const updatedSessions = prevSessions.map(session =>
        session.id === sessionId
          ? { ...session, completed: true, completedSlides: session.slides }
          : session
      );
      
      // Check if all sessions are now completed
      const allCompleted = updatedSessions.every(session => session.completed);
      if (allCompleted && prevSessions.some(session => !session.completed)) {
        // Trigger celebration if this was the last session to complete
        setTimeout(() => triggerCelebration(), 500);
      }
      
      return updatedSessions;
    });
  };

  const getSessionStatus = (session) => {
    if (session.completed) return 'completed';
    if (isToday(session.date)) return 'today';
    if (isPast(session.date)) return 'overdue';
    return 'upcoming';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'today': return '#007AFF';
      case 'overdue': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'today': return 'Today';
      case 'overdue': return 'Overdue';
      default: return 'Upcoming';
    }
  };

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Study Schedule</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Course Overview */}
        <Card style={{ borderLeftColor: course?.color || '#007AFF' }}>
          <CardHeader>
            <CardTitle style={styles.courseTitle}>
              <View style={styles.titleRow}>
                <View style={[styles.courseIcon, { backgroundColor: course?.color || '#007AFF' }]}>
                  <Ionicons name="book" size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.courseName, { color: colors.text }]}>{course?.name || 'Course'}</Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.text }]}>Overall Progress</Text>
                <Text style={[styles.progressPercentage, { color: course?.color || '#007AFF' }]}>
                  {totalSlides > 0 ? Math.round((completedSlides / totalSlides) * 100) : 0}%
                </Text>
              </View>
              <ProgressBar
                value={completedSlides}
                max={totalSlides}
                showLabel={false}
                size="lg"
              />
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {completedSlides} of {totalSlides} slides completed
              </Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#34C759' + '20' }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{completedSessions}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#FF9500' + '20' }]}>
                  <Ionicons name="time" size={20} color="#FF9500" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{sessions.length - completedSessions}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: (course?.color || '#007AFF') + '20' }]}>
                  <Ionicons name="trending-up" size={20} color={course?.color || '#007AFF'} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {totalSlides > 0 ? Math.round((completedSlides / totalSlides) * 100) : 0}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Progress</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Study Sessions */}
        <Card>
          <CardHeader>
            <CardTitle style={styles.sessionsTitle}>
              <View style={styles.titleRow}>
                <Ionicons name="calendar-outline" size={20} color={course?.color || '#007AFF'} />
                <Text style={[styles.sessionsTitleText, { color: colors.text }]}>Study Sessions</Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              sessions.map((session, index) => {
                const status = getSessionStatus(session);
                const statusColor = getStatusColor(status);
                const statusText = getStatusText(status);
                const isTodaySession = isToday(session.date);
                const isPastSession = isPast(session.date) && !isTodaySession;

                return (
                  <View key={session.id} style={[styles.sessionCard, { borderLeftColor: statusColor }]}>
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionInfo}>
                        <View style={styles.sessionDateRow}>
                          <Text style={[styles.sessionDate, { color: colors.text }]}>
                            {format(session.date, 'MMM dd, yyyy')}
                          </Text>
                          {isTodaySession && (
                            <View style={styles.todayBadge}>
                              <Text style={[styles.todayText, { color: '#FFFFFF' }]}>Today</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.sessionSlides, { color: colors.textSecondary }]}>
                          {session.slides} slides • Day {index + 1}
                        </Text>
                        <Text style={[styles.estimatedTime, { color: colors.textSecondary }]}>
                          ~{Math.ceil(session.slides * 2)} minutes
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Ionicons 
                          name={status === 'completed' ? 'checkmark' : status === 'today' ? 'play' : 'time'} 
                          size={12} 
                          color="#FFFFFF" 
                        />
                        <Text style={[styles.statusText, { color: '#FFFFFF' }]}>{statusText}</Text>
                      </View>
                    </View>

                    {session.completed ? (
                      <View style={styles.completedSession}>
                        <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                        <Text style={[styles.completedText, { color: colors.text }]}>Completed! 🎉</Text>
                        <Text style={[styles.completedSubtext, { color: colors.textSecondary }]}>
                          {session.slides} slides done
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.sessionActions}>
                        <Button
                          title={isTodaySession ? "Start Now" : isPastSession ? "Catch Up" : "Start Session"}
                          onPress={() => handleStartSession(session)}
                          size="sm"
                          style={{...styles.startButton, backgroundColor: course?.color || '#007AFF'}}
                        />
                        <Button
                          title="Mark Complete"
                          onPress={() => handleMarkComplete(session.id)}
                          variant="outline"
                          size="sm"
                          style={styles.completeButton}
                        />
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.noSessions}>
                <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.noSessionsTitle, { color: colors.text }]}>No Sessions Yet</Text>
                <Text style={[styles.noSessionsText, { color: colors.textSecondary }]}>
                  Study sessions will be generated based on your course content and study goals.
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Study Tips */}
        <Card style={styles.tipsCard}>
          <CardHeader>
            <CardTitle style={styles.tipsTitle}>
              <View style={styles.titleRow}>
                <Ionicons name="bulb-outline" size={20} color="#FF9500" />
                <Text style={[styles.tipsTitleText, { color: colors.text }]}>Study Tips</Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: '#007AFF' + '20' }]}>
                <Ionicons name="time" size={16} color="#007AFF" />
              </View>
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: colors.text }]}>Pomodoro Technique</Text>
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Study in 25-minute focused sessions with 5-minute breaks for maximum productivity
                </Text>
              </View>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: '#34C759' + '20' }]}>
                <Ionicons name="book" size={16} color="#34C759" />
              </View>
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: colors.text }]}>Review & Connect</Text>
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Review previous day's material before starting new content to build connections
                </Text>
              </View>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: '#FF9500' + '20' }]}>
                <Ionicons name="trending-up" size={16} color="#FF9500" />
              </View>
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: colors.text }]}>Track Progress</Text>
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Monitor your progress to stay motivated and maintain consistent study habits
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
      </ScrollView>

      {/* Course Completion Celebration Modal */}
      <Modal
        visible={showCelebration}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowCelebration(false)}
      >
        <View style={styles.celebrationOverlay}>
          <Animated.View 
            style={[
              styles.celebrationContainer,
              {
                backgroundColor: colors.card,
                transform: [{ scale: celebrationScale }],
                opacity: celebrationOpacity,
              }
            ]}
          >
            <View style={styles.celebrationContent}>
              <Animated.View style={styles.celebrationIcon}>
                <Ionicons name="trophy" size={60} color="#FFD700" />
              </Animated.View>
              <Text style={[styles.celebrationTitle, { color: colors.text }]}>
                🎉 Course Completed! 🎉
              </Text>
              <Text style={[styles.celebrationSubtitle, { color: colors.textSecondary }]}>
                Amazing work! You've finished all {totalSlides} slides in "{course?.name || 'this course'}".
              </Text>
              <View style={styles.celebrationStats}>
                <View style={styles.celebrationStat}>
                  <Text style={[styles.celebrationStatValue, { color: colors.text }]}>{completedSessions}</Text>
                  <Text style={[styles.celebrationStatLabel, { color: colors.textSecondary }]}>Sessions</Text>
                </View>
                <View style={styles.celebrationStat}>
                  <Text style={[styles.celebrationStatValue, { color: colors.text }]}>{totalSlides}</Text>
                  <Text style={[styles.celebrationStatLabel, { color: colors.textSecondary }]}>Slides</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  sessionSlides: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedSession: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    textAlign: 'center',
    flexShrink: 1,
  },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  startButton: {
    flex: 0.6,
    marginRight: 8,
  },
  completeButton: {
    flex: 0.4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 12,
    flex: 1,
  },
  courseTitle: {
    marginBottom: 0,
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
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sessionsTitle: {
    marginBottom: 0,
  },
  sessionsTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  sessionDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  todayBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  todayText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  estimatedTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  completedSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
    flexShrink: 1,
    paddingHorizontal: 8,
  },
  noSessions: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noSessionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  noSessionsText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  tipsCard: {
    borderLeftColor: '#FF9500',
  },
  tipsTitle: {
    marginBottom: 0,
  },
  tipsTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  // Celebration Modal Styles
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  celebrationContainer: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  celebrationContent: {
    alignItems: 'center',
  },
  celebrationIcon: {
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  celebrationSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  celebrationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  celebrationStat: {
    alignItems: 'center',
  },
  celebrationStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  celebrationStatLabel: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

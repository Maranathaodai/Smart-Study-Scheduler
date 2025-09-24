import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { dummyUser, dummyCourses, dummySessions } from '../lib/dummy-data';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useGoals } from '../contexts/GoalsContext';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useUser();
  const { getTodaysGoals, getCompletionRate } = useGoals();
  
  const dynamicStyles = StyleSheet.create({
    secondaryAction: {
      backgroundColor: colors.surface,
    },
    actionIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    actionText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    actionSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
  });
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  const totalSlides = dummyCourses.reduce((acc, course) => acc + course.totalSlides, 0);
  const completedSlides = dummyCourses.reduce((acc, course) => acc + course.completedSlides, 0);
  const todaySession = dummySessions[0];
  const todayCourse = dummyCourses.find(c => c.id === todaySession.courseId);
  
  // Smart insights
  const progressPercentage = totalSlides > 0 ? Math.round((completedSlides / totalSlides) * 100) : 0;
  const streakDays = 7; // Mock streak data
  const weeklyGoal = 5; // Mock weekly goal
  const completedThisWeek = 3; // Mock weekly progress
  
  // Time-aware greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };
  
  // Smart progress message
  const getProgressMessage = () => {
    if (progressPercentage >= 80) return "Outstanding progress! You're almost there! 🎉";
    if (progressPercentage >= 60) return "Great momentum! Keep pushing forward! 💪";
    if (progressPercentage >= 40) return "You're making solid progress! Stay focused! 🔥";
    if (progressPercentage >= 20) return "Good start! Every step counts! ⭐";
    return "Ready to begin your learning journey? Let's go! 🚀";
  };
  
  // Motivational quotes
  const quotes = [
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
    { text: "Education is the passport to the future.", author: "Malcolm X" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  ];
  
  const [currentQuote, setCurrentQuote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);
  
  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex]);
  };
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Change quote on login/component mount
    getRandomQuote();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={[styles.greeting, { color: colors.text }]}>
          {getTimeBasedGreeting()}, {user.name.split(' ')[0]} 👋
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {format(new Date(), 'EEEE, MMMM do')}
        </Text>
        <Text style={[styles.readyText, { color: '#8E8E93' }]}>
          Ready to learn?
        </Text>
      </Animated.View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Enhanced Motivational Quote - Now at the top */}
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={getRandomQuote}
        >
          <Card style={styles.quoteCard}>
            <CardContent style={styles.quoteContent}>
              <View style={styles.quoteHeader}>
                <Ionicons name="bulb-outline" size={20} color="#FF9500" />
                <Text style={[styles.quoteTitle, { color: colors.text }]}>Daily Motivation</Text>
              </View>
              <Text style={[styles.quoteText, { color: colors.text }]}>
                "{currentQuote.text}"
              </Text>
              <Text style={[styles.quoteAuthor, { color: colors.textSecondary }]}>
                — {currentQuote.author}
              </Text>
              <Text style={[styles.quoteHint, { color: colors.textSecondary }]}>
                Tap to get a new quote
              </Text>
            </CardContent>
          </Card>
        </TouchableOpacity>

        {/* Enhanced Quick Actions - My Courses and Study Plan first */}
        <View style={styles.quickActions}>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionButton, dynamicStyles.secondaryAction]}
              onPress={() => navigation.navigate('Courses' as never)}
            >
              <View style={dynamicStyles.actionIconContainer}>
                <Ionicons name="book" size={24} color="#007AFF" />
              </View>
              <Text style={dynamicStyles.actionText}>My Courses</Text>
              <Text style={dynamicStyles.actionSubtext}>{dummyCourses.length} active</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, dynamicStyles.secondaryAction]}
              onPress={() => navigation.navigate('Calendar' as never)}
            >
              <View style={dynamicStyles.actionIconContainer}>
                <Ionicons name="calendar" size={24} color="#007AFF" />
              </View>
              <Text style={dynamicStyles.actionText}>Study Plan</Text>
              <Text style={dynamicStyles.actionSubtext}>View schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Goals */}
        <Card style={styles.goalsCard}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              <View style={styles.titleRow}>
                <Ionicons name="flag" size={20} color="#FF9500" />
                <Text style={[styles.cardTitleText, { color: colors.text }]}>Today's Goals</Text>
              </View>
            </CardTitle>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Goals' as never)}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </CardHeader>
          <CardContent>
            {getTodaysGoals().length === 0 ? (
              <View style={styles.emptyGoals}>
                <Text style={[styles.emptyGoalsText, { color: colors.textSecondary }]}>
                  No goals for today. Tap "View All" to add some!
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.goalsProgress}>
                  <Text style={[styles.goalsProgressText, { color: colors.text }]}>
                    {getTodaysGoals().filter(g => g.completed).length} of {getTodaysGoals().length} completed
                  </Text>
                  <Text style={[styles.goalsProgressPercent, { color: colors.primary }]}>
                    {Math.round((getTodaysGoals().filter(g => g.completed).length / getTodaysGoals().length) * 100)}%
                  </Text>
                </View>
                {getTodaysGoals().slice(0, 3).map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    style={styles.goalItem}
                    onPress={() => navigation.navigate('Goals' as never)}
                  >
                    <View style={styles.goalItemContent}>
                      <View style={[
                        styles.goalCheckbox,
                        goal.completed && styles.goalCheckboxCompleted,
                        { borderColor: goal.completed ? colors.success : colors.border }
                      ]}>
                        {goal.completed && (
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        )}
                      </View>
                      <Text style={[
                        styles.goalItemText,
                        { color: colors.text },
                        goal.completed && styles.goalItemTextCompleted
                      ]}>
                        {goal.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {getTodaysGoals().length > 3 && (
                  <Text style={[styles.moreGoalsText, { color: colors.textSecondary }]}>
                    +{getTodaysGoals().length - 3} more goals
                  </Text>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Today's Session */}
        <Card style={{...styles.sessionCard, ...styles.sessionCardSpacing}}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              <View style={styles.titleRow}>
                <View style={styles.sessionIcon}>
                  <Ionicons name="play-circle" size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.cardTitleText, { color: colors.text }]}>Today's Focus</Text>
              </View>
            </CardTitle>
            <View style={styles.sessionMetaRight}>
              <Text style={[styles.slideCount, { color: colors.textSecondary }]}>{todaySession.slides} slides</Text>
            </View>
          </CardHeader>
          <CardContent style={styles.sessionCardContent}>
            <Text style={[styles.courseName, { color: colors.text }]}>
              {todayCourse?.name}
            </Text>
            <Text style={[styles.sessionDescription, { color: colors.textSecondary }]}>
              {progressPercentage > 50 
                ? "You're on fire! Let's keep this momentum going! 🔥" 
                : "Ready to dive in? Every slide brings you closer to mastery! 💪"
              }
            </Text>
            <View style={styles.sessionActions}>
              <Button 
                title="Start Session"
                onPress={() => navigation.navigate('DailyStudy' as never)}
                style={styles.startButton}
                size="lg"
              />
              <TouchableOpacity 
                style={styles.scheduleButton}
                onPress={() => navigation.navigate('StudySchedule' as never)}
              >
                <Ionicons name="calendar-outline" size={16} color="#007AFF" />
                <Text style={[styles.scheduleButtonText, { color: colors.primary }]}>View Schedule</Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* Enhanced Progress Snapshot - Now after Today's Focus */}
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => Alert.alert(
            'Learning Progress',
            `You've completed ${completedSlides} out of ${totalSlides} slides (${progressPercentage}%).\n\nKeep up the great work!`,
            [{ text: 'Continue Learning', style: 'default' }]
          )}
        >
          <Card style={styles.progressCard}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              <View style={styles.titleRow}>
                <View style={styles.progressIndicator} />
                <Text style={[styles.cardTitleText, { color: colors.text }]}>Learning Progress</Text>
              </View>
            </CardTitle>
            <View style={styles.progressStats}>
              <Text style={[styles.percentageText, { color: colors.text }]}>{progressPercentage}% Complete</Text>
            </View>
          </CardHeader>
          <CardContent>
            <ProgressBar
              value={completedSlides}
              max={totalSlides}
              showLabel={false}
              size="lg"
            />
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {getProgressMessage()}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{streakDays}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{completedThisWeek}/{weeklyGoal}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{totalSlides - completedSlides}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
              </View>
            </View>
          </CardContent>
        </Card>
        </TouchableOpacity>

        {/* Smart Insights Card */}
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => Alert.alert(
            'Smart Insights',
            'These insights are based on your study patterns and progress. They help you understand your learning habits and optimize your study schedule.',
            [{ text: 'Got it!', style: 'default' }]
          )}
        >
          <Card style={styles.insightsCard}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              <View style={styles.titleRow}>
                <Ionicons name="bulb" size={20} color="#FF9500" />
                <Text style={[styles.cardTitleText, { color: colors.text }]}>Smart Insights</Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.insightItem}>
              <Ionicons name="trending-up" size={16} color="#34C759" />
              <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                You're {streakDays} days ahead of your learning goal!
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Ionicons name="time" size={16} color="#007AFF" />
              <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                Best study time: {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'} sessions
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Ionicons name="trophy" size={16} color="#FF9500" />
              <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                Complete {weeklyGoal - completedThisWeek} more sessions this week for your goal!
              </Text>
            </View>
          </CardContent>
        </Card>
        </TouchableOpacity>

        {/* Add New Course Button */}
        <View style={styles.addCourseSection}>
          <Button
            title="Add New Course"
            onPress={() => navigation.navigate('AddCourse' as never)}
            variant="outline"
            size="lg"
            style={styles.addCourseButton}
          />
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  readyText: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  progressCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  sessionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  sessionCardSpacing: {
    marginTop: 8,
  },
  sessionCardContent: {
    paddingTop: 0,
  },
  insightsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  quoteCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 12,
  },
  sessionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  progressStats: {
    alignItems: 'flex-start',
    marginTop: 8,
  },
  percentageText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  sessionMeta: {
    alignItems: 'flex-end',
  },
  sessionMetaRight: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  slideCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  estimatedTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  courseName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 0,
    marginBottom: 8,
  },
  sessionDescription: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 22,
    fontWeight: '500',
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startButton: {
    flex: 0.7,
    marginRight: 12,
  },
  scheduleButton: {
    flex: 0.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  scheduleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 4,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  quickActions: {
    marginTop: 8,
  },
  addCourseSection: {
    marginTop: 8,
  },
  addCourseButton: {
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryAction: {
    backgroundColor: '#007AFF',
  },
  quoteContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  quoteText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  quoteHint: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  goalsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  viewAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyGoals: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyGoalsText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  goalsProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalsProgressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  goalsProgressPercent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  goalItem: {
    marginBottom: 8,
  },
  goalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalCheckboxCompleted: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  goalItemText: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  goalItemTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  moreGoalsText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

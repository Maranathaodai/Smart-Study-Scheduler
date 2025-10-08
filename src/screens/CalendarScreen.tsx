import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { courseService as supabaseCourseService } from '../lib/supabaseCourseService';
import { courseStorage } from '../lib/courseStorage';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Course, StudySession } from '../lib/types';

export default function CalendarScreen() {
  const { colors } = useTheme();
  const { studyStatistics, overallProgress } = useProgress();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  // Load courses and sessions on component mount and when user changes
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Also reload data when screen comes into focus (e.g., after deleting a course)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadData();
      }
    }, [user])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.log('No user logged in, skipping data load');
        return;
      }

      // Load courses from both Supabase database AND local storage
      const [databaseCourses, localCourses] = await Promise.all([
        supabaseCourseService.getCourses(user.id).catch(() => []), // Fallback to empty array if database fails
        courseStorage.loadCourses().catch(() => []) // Load from local storage
      ]);

      // Combine and deduplicate courses (prefer local over database for same ID)
      const combinedCourses = [...localCourses];
      databaseCourses.forEach(dbCourse => {
        if (!combinedCourses.find(localCourse => localCourse.id === dbCourse.id)) {
          combinedCourses.push(dbCourse);
        }
      });

      // Load study sessions from both sources
      const [databaseSessions, localSessions] = await Promise.all([
        // Get database sessions for all courses
        Promise.all(
          combinedCourses.map(course => 
            supabaseCourseService.getStudySessions(course.id).catch(() => [])
          )
        ).then(sessionArrays => sessionArrays.flat()),
        // Get local sessions
        courseStorage.loadStudySessions().catch(() => [])
      ]);

      // Combine and deduplicate sessions (prefer local over database for same ID)
      const combinedSessions = [...localSessions];
      databaseSessions.forEach(dbSession => {
        if (!combinedSessions.find(localSession => localSession.id === dbSession.id)) {
          combinedSessions.push(dbSession);
        }
      });
      
      setCourses(combinedCourses);
      setSessions(combinedSessions);
      
      console.log(`📅 Calendar loaded: ${combinedCourses.length} courses, ${combinedSessions.length} sessions`);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      // Don't show alert - just log error and continue with empty data
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getSessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return sessions.filter(session => {
      const sessionDate = new Date(session.date).toISOString().split('T')[0];
      return sessionDate === dateStr;
    });
  };

  const getCoursesForDate = (date: Date) => {
    const dateSessions = getSessionsForDate(date);
    const courseIds = [...new Set(dateSessions.map(session => session.courseId))];
    return courses.filter(course => courseIds.includes(course.id));
  };

  const getUniqueColorsForDate = (date: Date) => {
    const courses = getCoursesForDate(date);
    return [...new Set(courses.map(course => course?.color).filter(color => color))];
  };

  const getMultiColorBackground = (colors: string[]) => {
    if (colors.length === 0) return {};
    if (colors.length === 1) return { backgroundColor: colors[0] + '20' };
    
    // For multiple colors, create a gradient-like effect
    return {
      backgroundColor: '#F0F0F0',
      borderWidth: 2,
      borderColor: colors[0],
      borderStyle: 'solid' as const,
    };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const days = getDaysInMonth(selectedDate);
  const todaySessions = getSessionsForDate(selectedDate);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Study Calendar</Text>
          <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
            <Text style={[styles.todayButtonText, { color: colors.primary }]}>Today</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {formatDate(selectedDate)}
          </Text>
          
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Grid */}
        <Card style={styles.calendarCard}>
          <CardContent>
            <View style={styles.dayNames}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={[styles.dayName, { color: colors.textSecondary }]}>{day}</Text>
              ))}
            </View>
            
            <View style={styles.calendarGrid}>
              {days.map((day, index) => {
                if (!day) {
                  return <View key={index} style={styles.dayCell} />;
                }
                
                const isToday = day.toDateString() === new Date().toDateString();
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const daySessions = getSessionsForDate(day);
                const dayColors = getUniqueColorsForDate(day);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      isToday && styles.todayCell,
                      isSelected && styles.selectedCell,
                    ]}
                    onPress={() => setSelectedDate(day)}
                  >
                    <View style={[
                      styles.dateContainer,
                      getMultiColorBackground(dayColors),
                    ]}>
                      <Text
                        style={[
                          styles.dayText,
                          isToday && styles.todayText,
                          isSelected && styles.selectedText,
                          dayColors.length === 1 && { color: dayColors[0] },
                          dayColors.length > 1 && { color: dayColors[0], fontWeight: 'bold' },
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                      {dayColors.length > 1 && (
                        <View style={styles.multiColorIndicator}>
                          <View style={[styles.colorDot, { backgroundColor: dayColors[0] }]} />
                          <View style={[styles.colorDot, { backgroundColor: dayColors[1] }]} />
                          {dayColors.length > 2 && (
                            <View style={[styles.colorDot, { backgroundColor: '#8E8E93' }]} />
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </CardContent>
        </Card>

        {/* Today's Sessions */}
        <Card style={styles.sessionsCard}>
          <CardHeader>
            <CardTitle>
              {selectedDate.toDateString() === new Date().toDateString()
                ? "Today's Sessions"
                : `Sessions for ${selectedDate.toLocaleDateString()}`
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySessions.length > 0 ? (
              todaySessions.map((session, index) => {
                const course = courses.find(c => c.id === session.courseId);
                return (
                  <View key={session.id} style={styles.sessionItem}>
                    <View style={[styles.sessionColorBar, { backgroundColor: course?.color || '#8E8E93' }]} />
                    <View style={styles.sessionInfo}>
                      <Text style={[styles.sessionTitle, { color: colors.text }]}>
                        {course?.name || 'Unknown Course'}
                      </Text>
                      <Text style={[styles.sessionDetails, { color: colors.textSecondary }]}>
                        {session.slides} slides • {session.completed ? 'Completed' : 'Pending'}
                      </Text>
                    </View>
                    <View style={styles.sessionStatus}>
                      <Ionicons
                        name={session.completed ? 'checkmark-circle' : 'time'}
                        size={24}
                        color={session.completed ? '#34C759' : '#FF9500'}
                      />
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.noSessions}>
                <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.noSessionsText, { color: colors.textSecondary }]}>
                  No study sessions scheduled for this date
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions Summary */}
        {sessions.length > 0 && (
          <Card style={styles.upcomingCard}>
            <CardHeader>
              <CardTitle>Upcoming Sessions (Next 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const today = new Date();
                const next7Days = Array.from({ length: 7 }, (_, i) => {
                  const date = new Date(today);
                  date.setDate(today.getDate() + i);
                  return date;
                });

                const upcomingSessions = next7Days.flatMap(date => {
                  const dateSessions = getSessionsForDate(date);
                  return dateSessions.map(session => ({
                    ...session,
                    date: date,
                    course: courses.find(c => c.id === session.courseId)
                  }));
                }).filter(session => !session.completed);

                if (upcomingSessions.length === 0) {
                  return (
                    <View style={styles.noSessions}>
                      <Ionicons name="checkmark-circle" size={48} color={colors.textSecondary} />
                      <Text style={[styles.noSessionsText, { color: colors.textSecondary }]}>
                        No upcoming sessions in the next 7 days
                      </Text>
                    </View>
                  );
                }

                return upcomingSessions.slice(0, 5).map((session, index) => (
                  <View key={`${session.id}-${session.date.toDateString()}`} style={styles.upcomingSessionItem}>
                    <View style={[styles.sessionColorBar, { backgroundColor: session.course?.color || '#8E8E93' }]} />
                    <View style={styles.sessionInfo}>
                      <Text style={[styles.sessionTitle, { color: colors.text }]}>
                        {session.course?.name || 'Unknown Course'}
                      </Text>
                      <Text style={[styles.sessionDetails, { color: colors.textSecondary }]}>
                        {session.date.toLocaleDateString()} • {session.slides} slides
                      </Text>
                    </View>
                    <View style={styles.sessionStatus}>
                      <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
                        {session.date.toDateString() === today.toDateString() ? 'Today' : 
                         session.date.toDateString() === new Date(today.getTime() + 24*60*60*1000).toDateString() ? 'Tomorrow' :
                         session.date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                    </View>
                  </View>
                ));
              })()}
            </CardContent>
          </Card>
        )}

        {/* Course Legend - Show if user has courses */}
        {courses.length > 0 && (
          <Card style={styles.legendCard}>
            <CardHeader>
              <CardTitle>Course Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.legendGrid}>
                {courses.map((course) => (
                  <View key={course.id} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: course.color }]} />
                    <Text style={[styles.legendText, { color: colors.text }]}>{course.name}</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Study Statistics - Show real user data */}
        <Card style={styles.statsCard}>
          <CardHeader>
            <CardTitle>This Month's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {studyStatistics.currentStreak > 0 || studyStatistics.totalHoursStudied > 0 || courses.length > 0 ? (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{studyStatistics.currentStreak}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{studyStatistics.totalHoursStudied}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Hours Studied</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{courses.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Courses</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                  No study data yet. Add courses and start studying to see your progress!
                </Text>
              </View>
            )}
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  calendarCard: {
    marginBottom: 16,
  },
  dayNames: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  todayCell: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  selectedCell: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    color: '#000000',
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  dateContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  multiColorBackground: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  multiColorIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    flexDirection: 'row',
    gap: 1,
  },
  colorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sessionsCard: {
    marginBottom: 16,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    position: 'relative',
  },
  sessionColorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  sessionDetails: {
    fontSize: 14,
    color: '#8E8E93',
  },
  sessionStatus: {
    marginLeft: 12,
  },
  noSessions: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noSessionsText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
  },
  upcomingCard: {
    marginBottom: 16,
  },
  upcomingSessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'right',
  },
  legendCard: {
    marginBottom: 16,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    flex: 1,
  },
  statsCard: {
    marginBottom: 100,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  infoIcon: {
    marginTop: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
});

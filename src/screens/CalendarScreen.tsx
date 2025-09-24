import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { dummySessions, dummyCourses } from '../lib/dummy-data';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function CalendarScreen() {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());

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
    return dummySessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate.toDateString() === date.toDateString();
    });
  };

  const getCoursesForDate = (date: Date) => {
    const sessions = getSessionsForDate(date);
    return sessions.map(session => {
      const course = dummyCourses.find(c => c.id === session.courseId);
      return course;
    }).filter(Boolean);
  };

  const getUniqueColorsForDate = (date: Date) => {
    const courses = getCoursesForDate(date);
    return [...new Set(courses.map(course => course?.color))];
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

  const days = getDaysInMonth(selectedDate);
  const todaySessions = getSessionsForDate(selectedDate);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Study Calendar</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {formatDate(selectedDate)}
        </Text>
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
                      dayColors.length === 1 && { backgroundColor: dayColors[0] + '20' },
                      dayColors.length > 1 && styles.multiColorBackground,
                    ]}>
                      <Text
                        style={[
                          styles.dayText,
                          isToday && styles.todayText,
                          isSelected && styles.selectedText,
                          dayColors.length === 1 && { color: dayColors[0] },
                        ]}
                      >
                        {day.getDate()}
                      </Text>
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
                const course = dummyCourses.find(c => c.id === session.courseId);
                return (
                  <View key={session.id} style={styles.sessionItem}>
                    <View style={[styles.sessionColorBar, { backgroundColor: course?.color || '#8E8E93' }]} />
                    <View style={styles.sessionInfo}>
                      <Text style={[styles.sessionTitle, { color: colors.text }]}>
                        {course?.name}
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

        {/* Course Legend */}
        <Card style={styles.legendCard}>
          <CardHeader>
            <CardTitle>Course Colors</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.legendGrid}>
              {dummyCourses.map((course) => (
                <View key={course.id} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: course.color }]} />
                  <Text style={[styles.legendText, { color: colors.text }]}>{course.name}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Study Statistics */}
        <Card style={styles.statsCard}>
          <CardHeader>
            <CardTitle>This Month's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.statsGrid}>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => Alert.alert(
                  'Sessions Completed',
                  'You\'ve completed 12 study sessions this month! This includes both individual course sessions and combined study periods. Great job staying consistent!',
                  [{ text: 'Keep it up!', style: 'default' }]
                )}
              >
                <Text style={[styles.statValue, { color: colors.text }]}>12</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions Completed</Text>
                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} style={styles.infoIcon} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => Alert.alert(
                  'Slides Studied',
                  'You\'ve studied 156 slides this month! This represents all the content you\'ve covered across all your courses. Each slide brings you closer to mastery!',
                  [{ text: 'Amazing!', style: 'default' }]
                )}
              >
                <Text style={[styles.statValue, { color: colors.text }]}>156</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Slides Studied</Text>
                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} style={styles.infoIcon} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => Alert.alert(
                  'Hours Studied',
                  'You\'ve spent 8.5 hours studying this month! This is calculated based on your average study time per session. Consistent daily study is key to success!',
                  [{ text: 'Excellent!', style: 'default' }]
                )}
              >
                <Text style={[styles.statValue, { color: colors.text }]}>8.5</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Hours Studied</Text>
                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} style={styles.infoIcon} />
              </TouchableOpacity>
            </View>
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
});

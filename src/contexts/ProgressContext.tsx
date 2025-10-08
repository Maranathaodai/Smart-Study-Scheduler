import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudySession, Course } from '../lib/types';
import { courseStorage } from '../lib/courseStorage';
// Removed dummy data imports

interface WeeklyProgress {
  day: string;
  completed: number;
  total: number;
  sessions: StudySession[];
}

interface OverallProgress {
  totalSessions: number;
  completedSessions: number;
  totalSlides: number;
  completedSlides: number;
  completionPercentage: number;
}

interface CourseProgress {
  courseId: string;
  courseName: string;
  totalSessions: number;
  completedSessions: number;
  totalSlides: number;
  completedSlides: number;
  progressPercentage: number;
}

interface StudyStatistics {
  currentStreak: number;
  longestStreak: number;
  totalHoursStudied: number;
  averageSessionLength: number;
  mostProductiveDay: string;
  completionRate: number;
}

interface ProgressContextType {
  sessions: StudySession[];
  weeklyProgress: WeeklyProgress[];
  overallProgress: OverallProgress;
  courseProgress: CourseProgress[];
  studyStatistics: StudyStatistics;
  updateSessionCompletion: (sessionId: string, completed: boolean, completedSlides?: number) => void;
  addSession: (session: StudySession) => void;
  deleteCourse: (courseId: string) => void;
  getWeeklyData: () => WeeklyProgress[];
  getOverallData: () => OverallProgress;
  getCourseData: () => Promise<CourseProgress[]>;
  getStudyStatistics: () => StudyStatistics;
  refreshProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState<OverallProgress>({
    totalSessions: 0,
    completedSessions: 0,
    totalSlides: 0,
    completedSlides: 0,
    completionPercentage: 0,
  });
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [studyStatistics, setStudyStatistics] = useState<StudyStatistics>({
    currentStreak: 0,
    longestStreak: 0,
    totalHoursStudied: 0,
    averageSessionLength: 0,
    mostProductiveDay: 'None',
    completionRate: 0,
  });

  useEffect(() => {
    loadProgressData();
  }, []);

  useEffect(() => {
    // Calculate progress when sessions change
    calculateProgress().catch(error => {
      console.error('Error calculating progress:', error);
    });
  }, [sessions]);

  const loadProgressData = async () => {
    try {
      // Load sessions from user-specific storage instead of global storage
      const userSessions = await courseStorage.loadStudySessions();
      setSessions(userSessions);
    } catch (error) {
      console.log('Error loading progress data:', error);
    }
  };

  const saveProgressData = async () => {
    try {
      // Save sessions to user-specific storage instead of global storage
      await courseStorage.saveStudySessions(sessions);
    } catch (error) {
      console.log('Error saving progress data:', error);
    }
  };

  const calculateProgress = useCallback(async () => {
    const weeklyData = getWeeklyData();
    const overallData = getOverallData();
    const courseData = await getCourseData();
    const statisticsData = getStudyStatistics();

    setWeeklyProgress(weeklyData);
    setOverallProgress(overallData);
    setCourseProgress(courseData);
    setStudyStatistics(statisticsData);
  }, [sessions]); // Add sessions as dependency

  const getWeeklyData = (): WeeklyProgress[] => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Start from Monday

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData: WeeklyProgress[] = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);

      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.toDateString() === dayDate.toDateString();
      });

      const completedSessions = daySessions.filter(session => session.completed);
      
      weeklyData.push({
        day: weekDays[i],
        completed: completedSessions.length,
        total: daySessions.length,
        sessions: daySessions,
      });
    }

    return weeklyData;
  };

  const getOverallData = (): OverallProgress => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(session => session.completed).length;
    
    const totalSlides = sessions.reduce((sum, session) => sum + session.slides, 0);
    const completedSlides = sessions.reduce((sum, session) => 
      sum + (session.completed ? session.completedSlides : 0), 0
    );

    const completionPercentage = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    return {
      totalSessions,
      completedSessions,
      totalSlides,
      completedSlides,
      completionPercentage,
    };
  };

  const getCourseData = async (): Promise<CourseProgress[]> => {
    const courseMap = new Map<string, CourseProgress>();

    // Load actual courses to get real course names
    let courses: Course[] = [];
    try {
      courses = await courseStorage.loadCourses();
    } catch (error) {
      console.error('Error loading courses for progress calculation:', error);
    }

    // Calculate progress for each course
    sessions.forEach(session => {
      let courseData = courseMap.get(session.courseId);
      if (!courseData) {
        // Find the actual course name
        const course = courses.find(c => c.id === session.courseId);
        const courseName = course ? course.name : `Course ${session.courseId}`;
        
        courseData = {
          courseId: session.courseId,
          courseName,
          totalSessions: 0,
          completedSessions: 0,
          totalSlides: 0,
          completedSlides: 0,
          progressPercentage: 0,
        };
        courseMap.set(session.courseId, courseData);
      }
      
      courseData.totalSessions++;
      courseData.totalSlides += session.slides;
      
      if (session.completed) {
        courseData.completedSessions++;
        courseData.completedSlides += session.completedSlides;
      }
    });

    // Calculate percentages
    courseMap.forEach(courseData => {
      courseData.progressPercentage = courseData.totalSessions > 0 
        ? (courseData.completedSessions / courseData.totalSessions) * 100 
        : 0;
    });

    return Array.from(courseMap.values());
  };

  const getStudyStatistics = (): StudyStatistics => {
    const completedSessions = sessions.filter(session => session.completed);
    
    // Calculate current streak
    const calculateCurrentStreak = () => {
      const today = new Date();
      let streak = 0;
      let currentDate = new Date(today);
      
      while (true) {
        const daySessions = sessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate.toDateString() === currentDate.toDateString() && session.completed;
        });
        
        if (daySessions.length > 0) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      return streak;
    };

    // Calculate longest streak
    const calculateLongestStreak = () => {
      const completedDates = completedSessions.map(session => {
        const date = new Date(session.date);
        return date.toDateString();
      });
      
      const uniqueDates = [...new Set(completedDates)].sort();
      let longestStreak = 0;
      let currentStreak = 1;
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
      
      return Math.max(longestStreak, currentStreak);
    };

    // Calculate total hours studied (estimate 1 hour per completed session)
    const totalHoursStudied = completedSessions.length;

    // Calculate average session length
    const averageSessionLength = completedSessions.length > 0 
      ? completedSessions.reduce((sum, session) => sum + session.slides, 0) / completedSessions.length 
      : 0;

    // Find most productive day
    const dayCounts: { [key: string]: number } = {};
    completedSessions.forEach(session => {
      const dayName = new Date(session.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });
    
    const mostProductiveDay = Object.keys(dayCounts).length > 0 
      ? Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b)
      : 'None';

    // Calculate completion rate
    const completionRate = sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0;

    return {
      currentStreak: calculateCurrentStreak(),
      longestStreak: calculateLongestStreak(),
      totalHoursStudied,
      averageSessionLength: Math.round(averageSessionLength),
      mostProductiveDay,
      completionRate: Math.round(completionRate),
    };
  };

  const updateSessionCompletion = (sessionId: string, completed: boolean, completedSlides?: number) => {
    setSessions(prevSessions => {
      const updatedSessions = prevSessions.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              completed, 
              completedSlides: completedSlides !== undefined ? completedSlides : session.completedSlides 
            }
          : session
      );
      
      // Save updated sessions to user-specific storage
      courseStorage.saveStudySessions(updatedSessions).catch(error => {
        console.error('Error saving updated sessions:', error);
      });
      
      return updatedSessions;
    });
  };

  const addSession = (session: StudySession) => {
    setSessions(prevSessions => {
      const updatedSessions = [...prevSessions, session];
      
      // Save updated sessions to user-specific storage
      courseStorage.saveStudySessions(updatedSessions).catch(error => {
        console.error('Error saving new session:', error);
      });
      
      return updatedSessions;
    });
  };

  const deleteCourse = (courseId: string) => {
    setSessions(prevSessions => {
      const updatedSessions = prevSessions.filter(session => session.courseId !== courseId);
      
      // Save updated sessions to user-specific storage
      courseStorage.saveStudySessions(updatedSessions).catch(error => {
        console.error('Error saving sessions after course deletion:', error);
      });
      
      return updatedSessions;
    });
  };

  const refreshProgress = useCallback(async () => {
    // Reload sessions from user-specific storage
    await loadProgressData();
    // Progress will be calculated automatically via useEffect when sessions change
  }, []);

  return (
    <ProgressContext.Provider value={{
      sessions,
      weeklyProgress,
      overallProgress,
      courseProgress,
      studyStatistics,
      updateSessionCompletion,
      addSession,
      deleteCourse,
      getWeeklyData,
      getOverallData,
      getCourseData,
      getStudyStatistics,
      refreshProgress,
    }}>
      {children}
    </ProgressContext.Provider>
  );
};

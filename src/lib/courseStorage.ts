import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course, StudySession } from './types';

const COURSES_STORAGE_KEY = 'smart_study_courses';
const SESSIONS_STORAGE_KEY = 'smart_study_sessions';

// Predefined colors for courses (ensuring uniqueness)
const COURSE_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Lavender
  '#85C1E9', // Light Blue
  '#F8C471', // Orange
  '#82E0AA', // Light Green
  '#F1948A', // Salmon
  '#85C1E9', // Sky Blue
  '#D7BDE2', // Light Purple
  '#AED6F1', // Powder Blue
];

export class CourseStorage {
  private usedColors: Set<string> = new Set();

  // Generate unique color for course
  generateUniqueColor(): string {
    const availableColors = COURSE_COLORS.filter(color => !this.usedColors.has(color));
    
    if (availableColors.length === 0) {
      // If all colors are used, reset and start over
      this.usedColors.clear();
      return COURSE_COLORS[0];
    }
    
    const randomIndex = Math.floor(Math.random() * availableColors.length);
    const selectedColor = availableColors[randomIndex];
    this.usedColors.add(selectedColor);
    
    return selectedColor;
  }

  // Save courses to storage
  async saveCourses(courses: Course[]): Promise<void> {
    try {
      await AsyncStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
    } catch (error) {
      console.error('Error saving courses:', error);
      throw new Error('Failed to save courses');
    }
  }

  // Load courses from storage
  async loadCourses(): Promise<Course[]> {
    try {
      const coursesJson = await AsyncStorage.getItem(COURSES_STORAGE_KEY);
      if (coursesJson) {
        const courses = JSON.parse(coursesJson);
        // Update used colors based on loaded courses
        courses.forEach((course: Course) => {
          this.usedColors.add(course.color);
        });
        return courses;
      }
      return [];
    } catch (error) {
      console.error('Error loading courses:', error);
      return [];
    }
  }

  // Add new course
  async addCourse(course: Course): Promise<void> {
    try {
      const existingCourses = await this.loadCourses();
      
      // Ensure unique color
      if (this.usedColors.has(course.color)) {
        course.color = this.generateUniqueColor();
      } else {
        this.usedColors.add(course.color);
      }
      
      existingCourses.push(course);
      await this.saveCourses(existingCourses);
    } catch (error) {
      console.error('Error adding course:', error);
      throw new Error('Failed to add course');
    }
  }

  // Update course
  async updateCourse(updatedCourse: Course): Promise<void> {
    try {
      const courses = await this.loadCourses();
      const index = courses.findIndex(c => c.id === updatedCourse.id);
      
      if (index !== -1) {
        courses[index] = updatedCourse;
        await this.saveCourses(courses);
      }
    } catch (error) {
      console.error('Error updating course:', error);
      throw new Error('Failed to update course');
    }
  }

  // Delete course
  async deleteCourse(courseId: string): Promise<void> {
    try {
      const courses = await this.loadCourses();
      const filteredCourses = courses.filter(c => c.id !== courseId);
      await this.saveCourses(filteredCourses);
      
      // Remove color from used colors
      const deletedCourse = courses.find(c => c.id === courseId);
      if (deletedCourse) {
        this.usedColors.delete(deletedCourse.color);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      throw new Error('Failed to delete course');
    }
  }

  // Save study sessions
  async saveStudySessions(sessions: StudySession[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving study sessions:', error);
      throw new Error('Failed to save study sessions');
    }
  }

  // Load study sessions
  async loadStudySessions(): Promise<StudySession[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
      if (sessionsJson) {
        return JSON.parse(sessionsJson);
      }
      return [];
    } catch (error) {
      console.error('Error loading study sessions:', error);
      return [];
    }
  }

  // Get courses with their study sessions
  async getCoursesWithSessions(): Promise<Array<Course & { sessions: StudySession[] }>> {
    try {
      const courses = await this.loadCourses();
      const allSessions = await this.loadStudySessions();
      
      return courses.map(course => ({
        ...course,
        sessions: allSessions.filter(session => session.courseId === course.id)
      }));
    } catch (error) {
      console.error('Error getting courses with sessions:', error);
      return [];
    }
  }

  // Get study sessions for a specific date
  async getSessionsForDate(date: Date): Promise<StudySession[]> {
    try {
      const sessions = await this.loadStudySessions();
      const targetDate = date.toDateString();
      
      return sessions.filter(session => 
        new Date(session.date).toDateString() === targetDate
      );
    } catch (error) {
      console.error('Error getting sessions for date:', error);
      return [];
    }
  }

  // Get study sessions for a date range
  async getSessionsForDateRange(startDate: Date, endDate: Date): Promise<StudySession[]> {
    try {
      const sessions = await this.loadStudySessions();
      
      return sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= startDate && sessionDate <= endDate;
      });
    } catch (error) {
      console.error('Error getting sessions for date range:', error);
      return [];
    }
  }

  // Update session progress
  async updateSessionProgress(sessionId: string, progress: number): Promise<void> {
    try {
      const sessions = await this.loadStudySessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex !== -1) {
        sessions[sessionIndex].sessionProgress = progress;
        sessions[sessionIndex].completed = progress >= 100;
        sessions[sessionIndex].completedChunks = Math.floor((progress / 100) * sessions[sessionIndex].chunks.length);
        
        await this.saveStudySessions(sessions);
      }
    } catch (error) {
      console.error('Error updating session progress:', error);
      throw new Error('Failed to update session progress');
    }
  }

  // Get course progress statistics
  async getCourseProgress(courseId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    totalChunks: number;
    completedChunks: number;
    progressPercentage: number;
    estimatedTimeRemaining: number;
  }> {
    try {
      const sessions = await this.loadStudySessions();
      const courseSessions = sessions.filter(s => s.courseId === courseId);
      
      const totalSessions = courseSessions.length;
      const completedSessions = courseSessions.filter(s => s.completed).length;
      
      const totalChunks = courseSessions.reduce((sum, session) => sum + session.chunks.length, 0);
      const completedChunks = courseSessions.reduce((sum, session) => sum + session.completedChunks, 0);
      
      const progressPercentage = totalChunks > 0 ? (completedChunks / totalChunks) * 100 : 0;
      
      const remainingSessions = courseSessions.filter(s => !s.completed);
      const estimatedTimeRemaining = remainingSessions.reduce((sum, session) => sum + session.totalEstimatedTime, 0);
      
      return {
        totalSessions,
        completedSessions,
        totalChunks,
        completedChunks,
        progressPercentage,
        estimatedTimeRemaining,
      };
    } catch (error) {
      console.error('Error getting course progress:', error);
      return {
        totalSessions: 0,
        completedSessions: 0,
        totalChunks: 0,
        completedChunks: 0,
        progressPercentage: 0,
        estimatedTimeRemaining: 0,
      };
    }
  }
}

// Singleton instance
export const courseStorage = new CourseStorage();

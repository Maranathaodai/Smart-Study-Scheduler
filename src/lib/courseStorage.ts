import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course, StudySession } from './types';
import { supabase } from './supabase';

// User-specific storage keys
const getCoursesStorageKey = (userId: string) => `smart_study_courses_${userId}`;
const getSessionsStorageKey = (userId: string) => `smart_study_sessions_${userId}`;

// Predefined colors for courses (ensuring uniqueness) - Expanded palette
const COURSE_COLORS = [
  // Vibrant Primary Colors
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Turquoise
  '#45B7D1', // Ocean Blue
  '#96CEB4', // Sage Green
  '#FFEAA7', // Sunny Yellow
  '#DDA0DD', // Plum
  '#FF7675', // Soft Red
  '#74B9FF', // Sky Blue
  '#55A3FF', // Royal Blue
  '#00B894', // Emerald
  
  // Warm Tones
  '#FD79A8', // Hot Pink
  '#E17055', // Terracotta
  '#F39C12', // Orange
  '#E74C3C', // Crimson
  '#F1C40F', // Golden Yellow
  '#E67E22', // Carrot Orange
  '#8E44AD', // Purple
  '#9B59B6', // Amethyst
  '#FF6348', // Tomato
  '#FF4757', // Watermelon
  
  // Cool Tones
  '#3742FA', // Bright Blue
  '#2F3542', // Dark Blue
  '#40407A', // Navy
  '#706FD3', // Lavender Blue
  '#546DE5', // Cornflower Blue
  '#FF5722', // Deep Orange
  '#00CEC9', // Cyan
  '#6C5CE7', // Indigo
  '#A29BFE', // Periwinkle
  '#FD79A8', // Rose
  
  // Earth Tones
  '#C0392B', // Dark Red
  '#8B4513', // Saddle Brown
  '#D4AC0D', // Dark Goldenrod
  '#148F77', // Sea Green
  '#1B4F72', // Dark Blue
  '#7D3C98', // Royal Purple
  '#A04000', // Rust
  '#B7950B', // Dark Yellow
  '#239B56', // Forest Green
  '#D35400', // Pumpkin
  
  // Pastel Tones
  '#FFB3BA', // Light Pink
  '#FFDFBA', // Peach
  '#FFFFBA', // Light Yellow
  '#BAFFC9', // Light Green
  '#BAE1FF', // Light Blue
  '#C9C9FF', // Light Purple
  '#FFB347', // Light Orange
  '#FFD1DC', // Blush Pink
  '#E6E6FA', // Lavender
  '#F0E68C', // Khaki
  
  // Modern Colors
  '#FF6B9D', // Magenta
  '#4DABF7', // Cerulean
  '#69DB7C', // Mint Green
  '#FFD43B', // Lemon
  '#9775FA', // Violet
  '#51CF66', // Spring Green
  '#FF8787', // Salmon
  '#339AF0', // Azure
  '#FA5252', // Red
  '#37B24D', // Green
  
  // Professional Colors
  '#495057', // Charcoal
  '#6C757D', // Slate
  '#ADB5BD', // Gray
  '#343A40', // Dark Gray
  '#212529', // Almost Black
  '#F8F9FA', // Light Gray
  '#E9ECEF', // Silver
  '#DEE2E6', // Platinum
  '#CED4DA', // Light Silver
  '#6F42C1', // Indigo
];

// Add color generation for when we run out of predefined colors
const generateRandomColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 30) + 70; // 70-100%
  const lightness = Math.floor(Math.random() * 20) + 40; // 40-60%
  
  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  
  return hslToHex(hue, saturation, lightness);
};

export class CourseStorage {
  private usedColors: Set<string> = new Set();

  // Get current user ID (returns null if not authenticated)
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Generate unique color for course
  generateUniqueColor(): string {
    const availableColors = COURSE_COLORS.filter(color => !this.usedColors.has(color));
    
    if (availableColors.length === 0) {
      // If all predefined colors are used, generate a random color
      let randomColor = generateRandomColor();
      let attempts = 0;
      
      // Try to generate a unique random color (max 10 attempts)
      while (this.usedColors.has(randomColor) && attempts < 10) {
        randomColor = generateRandomColor();
        attempts++;
      }
      
      this.usedColors.add(randomColor);
      return randomColor;
    }
    
    const randomIndex = Math.floor(Math.random() * availableColors.length);
    const selectedColor = availableColors[randomIndex];
    this.usedColors.add(selectedColor);
    
    return selectedColor;
  }

  // Save courses to storage (user-specific)
  async saveCourses(courses: Course[]): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const storageKey = getCoursesStorageKey(userId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(courses));
    } catch (error) {
      console.error('Error saving courses:', error);
      throw new Error('Failed to save courses');
    }
  }

  // Load courses from storage (user-specific)
  async loadCourses(): Promise<Course[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        // Return empty array if user not authenticated
        return [];
      }
      const storageKey = getCoursesStorageKey(userId);
      const coursesJson = await AsyncStorage.getItem(storageKey);
      if (coursesJson) {
        const courses = JSON.parse(coursesJson);
        // Update used colors based on loaded courses and deserialize dates
        return courses.map((course: any) => {
          this.usedColors.add(course.color);
          return {
            ...course,
            // Only convert to Date if it's a string, otherwise keep as-is
            createdAt: typeof course.createdAt === 'string' ? new Date(course.createdAt) : course.createdAt || new Date(),
          };
        });
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
      
      // Also delete all study sessions for this course
      const sessions = await this.loadStudySessions();
      const filteredSessions = sessions.filter(s => s.courseId !== courseId);
      await this.saveStudySessions(filteredSessions);
      
      // Remove color from used colors
      const deletedCourse = courses.find(c => c.id === courseId);
      if (deletedCourse) {
        this.usedColors.delete(deletedCourse.color);
      }
      
      console.log(`🗑️ Deleted course ${courseId} and ${sessions.length - filteredSessions.length} associated sessions`);
    } catch (error) {
      console.error('Error deleting course:', error);
      throw new Error('Failed to delete course');
    }
  }

  // Save study sessions (user-specific)
  async saveStudySessions(sessions: StudySession[]): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const storageKey = getSessionsStorageKey(userId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving study sessions:', error);
      throw new Error('Failed to save study sessions');
    }
  }

  // Load study sessions (user-specific)
  async loadStudySessions(): Promise<StudySession[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        // Return empty array if user not authenticated
        return [];
      }
      const storageKey = getSessionsStorageKey(userId);
      const sessionsJson = await AsyncStorage.getItem(storageKey);
      if (sessionsJson) {
        const sessions = JSON.parse(sessionsJson);
        // Convert date strings back to Date objects
        return sessions.map((session: any) => ({
          ...session,
          // Only convert to Date if it's a string, otherwise keep as-is
          date: typeof session.date === 'string' ? new Date(session.date) : session.date || new Date(),
        }));
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

  // Clear all user data (for account deletion only - NOT for logout)
  async clearUserData(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.log('No user to clear data for');
        return;
      }
      const coursesKey = getCoursesStorageKey(userId);
      const sessionsKey = getSessionsStorageKey(userId);
      
      await Promise.all([
        AsyncStorage.removeItem(coursesKey),
        AsyncStorage.removeItem(sessionsKey)
      ]);
      
      // Reset used colors
      this.usedColors.clear();
      console.log('User data cleared successfully');
    } catch (error) {
      console.error('Error clearing user data:', error);
      // Don't throw error here as user might not be authenticated
    }
  }
}

// Singleton instance
export const courseStorage = new CourseStorage();

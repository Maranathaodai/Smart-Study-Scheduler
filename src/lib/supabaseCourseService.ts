import { supabase, TABLES } from './supabase';
import { Course, StudySession, CourseFile } from './types';

export class SupabaseCourseService {
  // Create a new course
  async createCourse(
    name: string,
    category: string,
    difficulty: 'easy' | 'medium' | 'hard',
    priority: number,
    color: string,
    userId: string
  ): Promise<Course> {
    try {
      const course: Omit<Course, 'id'> = {
        name,
        category,
        difficulty,
        priority,
        color,
        createdAt: new Date(),
        totalSlides: 0,
        completedSlides: 0,
        files: [],
        processedChunks: [],
        keyConcepts: [],
        totalEstimatedTime: 0,
        processingStatus: 'pending',
        lastProcessed: null,
      };

      const { data, error } = await supabase
        .from(TABLES.COURSES)
        .insert([course])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create course: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Create course error:', error);
      throw error;
    }
  }

  // Get all courses for a user
  async getCourses(userId: string): Promise<Course[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COURSES)
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch courses: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Get courses error:', error);
      throw error;
    }
  }

  // Get course by ID
  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COURSES)
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Course not found
        }
        throw new Error(`Failed to fetch course: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Get course by ID error:', error);
      throw error;
    }
  }

  // Update course
  async updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COURSES)
        .update({
          ...updates,
          updatedAt: new Date(),
        })
        .eq('id', courseId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update course: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Update course error:', error);
      throw error;
    }
  }

  // Delete course
  async deleteCourse(courseId: string): Promise<void> {
    try {
      // Delete related study sessions first
      await supabase
        .from(TABLES.STUDY_SESSIONS)
        .delete()
        .eq('courseId', courseId);

      // Delete course files
      await supabase
        .from(TABLES.COURSE_FILES)
        .delete()
        .eq('courseId', courseId);

      // Delete the course
      const { error } = await supabase
        .from(TABLES.COURSES)
        .delete()
        .eq('id', courseId);

      if (error) {
        throw new Error(`Failed to delete course: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete course error:', error);
      throw error;
    }
  }

  // Add files to course
  async addFilesToCourse(courseId: string, files: CourseFile[]): Promise<void> {
    try {
      const fileRecords = files.map(file => ({
        courseId,
        name: file.name,
        type: file.type,
        size: file.size,
        uri: file.uri,
        uploadedAt: new Date(),
      }));

      const { error } = await supabase
        .from(TABLES.COURSE_FILES)
        .insert(fileRecords);

      if (error) {
        throw new Error(`Failed to add files to course: ${error.message}`);
      }
    } catch (error) {
      console.error('Add files to course error:', error);
      throw error;
    }
  }

  // Create study session
  async createStudySession(session: Omit<StudySession, 'id'>): Promise<StudySession> {
    try {
      const { data, error } = await supabase
        .from(TABLES.STUDY_SESSIONS)
        .insert([session])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create study session: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Create study session error:', error);
      throw error;
    }
  }

  // Get study sessions for a course
  async getStudySessions(courseId: string): Promise<StudySession[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.STUDY_SESSIONS)
        .select('*')
        .eq('courseId', courseId)
        .order('date', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch study sessions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Get study sessions error:', error);
      throw error;
    }
  }

  // Update study session
  async updateStudySession(sessionId: string, updates: Partial<StudySession>): Promise<StudySession> {
    try {
      const { data, error } = await supabase
        .from(TABLES.STUDY_SESSIONS)
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update study session: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Update study session error:', error);
      throw error;
    }
  }

  // Get study sessions for a specific date
  async getStudySessionsForDate(date: string, userId: string): Promise<StudySession[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.STUDY_SESSIONS)
        .select(`
          *,
          courses!inner(userId)
        `)
        .eq('courses.userId', userId)
        .gte('date', `${date}T00:00:00`)
        .lt('date', `${date}T23:59:59`)
        .order('date', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch study sessions for date: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Get study sessions for date error:', error);
      throw error;
    }
  }
}

export const courseService = new SupabaseCourseService();



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
        .insert([{
          id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: course.name,
          category: course.category,
          difficulty: course.difficulty,
          priority: course.priority,
          color: course.color,
          user_id: userId,
          created_at: course.createdAt,
          total_slides: course.totalSlides,
          completed_slides: course.completedSlides,
          processed_chunks: course.processedChunks,
          key_concepts: course.keyConcepts,
          total_estimated_time: course.totalEstimatedTime,
          processing_status: course.processingStatus,
          last_processed: course.lastProcessed,
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create course: ${error.message}`);
      }

      // Convert database format back to Course format
      return {
        id: data.id,
        name: data.name,
        category: data.category,
        difficulty: data.difficulty,
        priority: data.priority,
        color: data.color,
        createdAt: new Date(data.created_at),
        totalSlides: data.total_slides,
        completedSlides: data.completed_slides,
        files: [],
        processedChunks: data.processed_chunks || [],
        keyConcepts: data.key_concepts || [],
        totalEstimatedTime: data.total_estimated_time,
        processingStatus: data.processing_status,
        lastProcessed: data.last_processed ? new Date(data.last_processed) : null,
      };
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

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
      const dbUpdates: any = {
        updated_at: new Date(),
      };

      // Map Course properties to database column names
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.totalSlides !== undefined) dbUpdates.total_slides = updates.totalSlides;
      if (updates.completedSlides !== undefined) dbUpdates.completed_slides = updates.completedSlides;
      if (updates.processedChunks !== undefined) dbUpdates.processed_chunks = updates.processedChunks;
      if (updates.keyConcepts !== undefined) dbUpdates.key_concepts = updates.keyConcepts;
      if (updates.totalEstimatedTime !== undefined) dbUpdates.total_estimated_time = updates.totalEstimatedTime;
      if (updates.processingStatus !== undefined) dbUpdates.processing_status = updates.processingStatus;
      if (updates.lastProcessed !== undefined) dbUpdates.last_processed = updates.lastProcessed;

      const { data, error } = await supabase
        .from(TABLES.COURSES)
        .update(dbUpdates)
        .eq('id', courseId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update course: ${error.message}`);
      }

      // Convert database format back to Course format
      return {
        id: data.id,
        name: data.name,
        category: data.category,
        difficulty: data.difficulty,
        priority: data.priority,
        color: data.color,
        createdAt: new Date(data.created_at),
        totalSlides: data.total_slides,
        completedSlides: data.completed_slides,
        files: [],
        processedChunks: data.processed_chunks || [],
        keyConcepts: data.key_concepts || [],
        totalEstimatedTime: data.total_estimated_time,
        processingStatus: data.processing_status,
        lastProcessed: data.last_processed ? new Date(data.last_processed) : null,
      };
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
        .eq('course_id', courseId);

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
      console.log('🔄 Adding files to course:', courseId);
      console.log('📁 Number of files:', files.length);
      
      // First verify the course exists and belongs to the current user
      const { data: course, error: courseError } = await supabase
        .from(TABLES.COURSES)
        .select('id, user_id')
        .eq('id', courseId)
        .single();

      if (courseError) {
        console.error('❌ Course verification failed:', courseError);
        throw new Error(`Course not found: ${courseError.message}`);
      }

      if (!course) {
        throw new Error(`Course with ID ${courseId} does not exist`);
      }

      console.log('✅ Course verified:', course.id);

      // Prepare file records with proper validation
      const fileRecords = files.map(file => {
        const record = {
          id: file.id || `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          course_id: courseId,
          name: file.name || 'Unnamed file',
          type: file.type || 'unknown',
          size: file.size || 0,
          uri: file.uri || null,
          uploaded_at: file.uploadedAt || new Date(),
        };
        
        console.log('📄 Preparing file record:', {
          id: record.id,
          name: record.name,
          type: record.type,
          size: record.size
        });
        
        return record;
      });

      console.log('💾 Inserting file records...');
      
      const { error } = await supabase
        .from(TABLES.COURSE_FILES)
        .insert(fileRecords);

      if (error) {
        console.error('❌ File insertion failed:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Failed to add files to course: ${error.message}`);
      }

      console.log('✅ Successfully added', files.length, 'files to course');
      
    } catch (error) {
      console.error('❌ Add files to course error:', error);
      throw error;
    }
  }

  // Create study session
  async createStudySession(session: Omit<StudySession, 'id'>): Promise<StudySession> {
    try {
      const sessionData = {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        course_id: session.courseId, // Use course_id to match actual database schema
        date: session.date,
        slides: session.slides,
        completed: session.completed,
        completed_slides: session.completedSlides, // Use snake_case to match database
        chunks: session.chunks,
        total_estimated_time: session.totalEstimatedTime, // Use snake_case to match database
        completed_chunks: session.completedChunks, // Use snake_case to match database
        current_chunk_index: session.currentChunkIndex, // Use snake_case to match database
        session_progress: session.sessionProgress, // Use snake_case to match database
        learning_objectives: session.learningObjectives, // Use snake_case to match database
        assessment_questions: session.assessmentQuestions, // Use snake_case to match database
      };

      const { data, error } = await supabase
        .from(TABLES.STUDY_SESSIONS)
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create study session: ${error.message}`);
      }

      // Convert database format back to StudySession format
      return {
        id: data.id,
        courseId: data.course_id,
        date: new Date(data.date),
        slides: data.slides,
        completed: data.completed,
        completedSlides: data.completed_slides,
        chunks: data.chunks || [],
        totalEstimatedTime: data.total_estimated_time,
        completedChunks: data.completed_chunks,
        currentChunkIndex: data.current_chunk_index,
        sessionProgress: data.session_progress,
        learningObjectives: data.learning_objectives || [],
        assessmentQuestions: data.assessment_questions || [],
      };
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
        .eq('course_id', courseId) // Use course_id to match actual database schema
        .order('date', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch study sessions: ${error.message}`);
      }

      // Convert database format back to StudySession format
      return (data || []).map(session => ({
        id: session.id,
        courseId: session.course_id, // Convert from database snake_case to app camelCase
        date: new Date(session.date),
        slides: session.slides,
        completed: session.completed,
        completedSlides: session.completed_slides, // Convert from database snake_case
        chunks: session.chunks || [],
        totalEstimatedTime: session.total_estimated_time, // Convert from database snake_case
        completedChunks: session.completed_chunks, // Convert from database snake_case
        currentChunkIndex: session.current_chunk_index, // Convert from database snake_case
        sessionProgress: session.session_progress, // Convert from database snake_case
        learningObjectives: session.learning_objectives || [], // Convert from database snake_case
        assessmentQuestions: session.assessment_questions || [], // Convert from database snake_case
      }));
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



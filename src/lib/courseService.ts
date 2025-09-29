import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Course, CourseFile, ContentProcessingResult } from './types';
import { contentProcessor } from './contentProcessor';

export class CourseService {
  private contentProcessor = contentProcessor;

  async uploadCourseFiles(): Promise<CourseFile[]> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/plain', 'text/markdown'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) {
        return [];
      }

      const uploadedFiles: CourseFile[] = [];

      for (const file of result.assets) {
        const fileInfo: CourseFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: this.getFileType(file.name),
          size: file.size || 0,
          uploadedAt: new Date(),
        };

        uploadedFiles.push(fileInfo);
      }

      return uploadedFiles;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(`Failed to upload files: ${error.message}`);
    }
  }

  async processCourseContent(course: Course): Promise<ContentProcessingResult | null> {
    if (!course.files || course.files.length === 0) {
      throw new Error('No files to process');
    }

    try {
      // Update course processing status
      course.processingStatus = 'processing';
      course.lastProcessed = new Date();

      const allChunks: any[] = [];
      const allKeyConcepts: string[] = [];
      let totalProcessingTime = 0;

      // Process each file
      for (const file of course.files) {
        try {
          // Get file path (in a real app, you'd store the actual file path)
          const filePath = await this.getFilePath(file);
          
          const result = await this.contentProcessor.processFile(filePath, file.name);
          
          allChunks.push(...result.chunks);
          allKeyConcepts.push(...result.keyConcepts);
          totalProcessingTime += result.processingMetadata.processingTime;
        } catch (fileError) {
          console.error(`Failed to process file ${file.name}:`, fileError);
          // Continue with other files
        }
      }

      if (allChunks.length === 0) {
        course.processingStatus = 'failed';
        throw new Error('No content could be processed from the uploaded files');
      }

      // Update course with processed content
      course.processedChunks = allChunks;
      course.keyConcepts = [...new Set(allKeyConcepts)]; // Remove duplicates
      course.totalEstimatedTime = allChunks.reduce((sum, chunk) => sum + chunk.estimatedTime, 0);
      course.processingStatus = 'completed';

      return {
        chunks: allChunks,
        totalEstimatedTime: course.totalEstimatedTime,
        keyConcepts: course.keyConcepts,
        processingMetadata: {
          fileType: 'mixed',
          processingTime: totalProcessingTime,
          aiAnalysisUsed: true,
          manualAdjustments: false,
        },
      };
    } catch (error) {
      console.error('Course processing error:', error);
      course.processingStatus = 'failed';
      throw new Error(`Failed to process course content: ${error.message}`);
    }
  }

  async processManualContent(content: string, courseName: string): Promise<ContentProcessingResult | null> {
    try {
      console.log('Processing manual content for course:', courseName);
      
      if (!content.trim()) {
        console.log('No content to process');
        return null;
      }

      // Process the manual content directly using contentProcessor
      const result = await this.contentProcessor.processFileContent(content, courseName, 'text');
      
      if (result) {
        return {
          chunks: result.chunks,
          keyConcepts: result.keyConcepts,
          totalEstimatedTime: result.totalEstimatedTime,
          processingMetadata: {
            fileType: 'text',
            processingTime: result.processingMetadata.processingTime,
            aiAnalysisUsed: result.processingMetadata.aiAnalysisUsed,
            manualAdjustments: false,
          },
        };
      }

      return null;
    } catch (error) {
      console.error('Error processing manual content:', error);
      return null;
    }
  }

  async createCourse(
    name: string,
    category: string,
    difficulty: 'easy' | 'medium' | 'hard',
    priority: number,
    color: string
  ): Promise<Course> {
    const course: Course = {
      id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      category,
      files: [],
      totalSlides: 0,
      completedSlides: 0,
      createdAt: new Date(),
      color,
      difficulty,
      priority,
      processingStatus: 'pending',
    };

    return course;
  }

  async addFilesToCourse(course: Course): Promise<Course> {
    const uploadedFiles = await this.uploadCourseFiles();
    course.files.push(...uploadedFiles);
    
    // Update total slides estimate (rough calculation)
    course.totalSlides = uploadedFiles.reduce((sum, file) => {
      // Rough estimate: 1 slide per 500 characters for text, 1 slide per image
      return sum + Math.max(1, Math.floor(file.size / 500));
    }, course.totalSlides);

    return course;
  }

  async reprocessCourse(course: Course): Promise<ContentProcessingResult | null> {
    if (course.processingStatus === 'processing') {
      throw new Error('Course is already being processed');
    }

    return await this.processCourseContent(course);
  }

  async getCourseProgress(course: Course): Promise<{
    totalChunks: number;
    completedChunks: number;
    progressPercentage: number;
    estimatedTimeRemaining: number;
  }> {
    if (!course.processedChunks) {
      return {
        totalChunks: 0,
        completedChunks: 0,
        progressPercentage: 0,
        estimatedTimeRemaining: 0,
      };
    }

    const totalChunks = course.processedChunks.length;
    const completedChunks = course.processedChunks.filter(chunk => 
      chunk.content.some(c => c.completed) // Simple completion check
    ).length;

    const progressPercentage = totalChunks > 0 ? (completedChunks / totalChunks) * 100 : 0;
    
    const remainingChunks = course.processedChunks.filter(chunk => 
      !chunk.content.some(c => c.completed)
    );
    const estimatedTimeRemaining = remainingChunks.reduce(
      (sum, chunk) => sum + chunk.estimatedTime, 
      0
    );

    return {
      totalChunks,
      completedChunks,
      progressPercentage,
      estimatedTimeRemaining,
    };
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'txt':
        return 'text/plain';
      case 'md':
        return 'text/markdown';
      default:
        return 'application/octet-stream';
    }
  }

  private async getFilePath(file: CourseFile): Promise<string> {
    // Return the actual file URI if available, otherwise use placeholder
    if (file.uri) {
      console.log('Using actual file URI:', file.uri);
      return file.uri;
    }
    // For demo purposes, return a placeholder with file info
    console.log('Using placeholder path for:', file.name);
    return `file://placeholder/path/${file.name}`;
  }

  // Method to manually adjust chunk boundaries
  async adjustCourseChunks(
    course: Course,
    adjustments: Array<{
      chunkId: string;
      action: 'split' | 'merge' | 'resize';
      parameters: any;
    }>
  ): Promise<Course> {
    if (!course.processedChunks) {
      throw new Error('Course has no processed chunks to adjust');
    }

    const adjustedChunks = await this.contentProcessor.adjustChunkBoundaries(
      course.processedChunks,
      adjustments
    );

    course.processedChunks = adjustedChunks;
    course.totalEstimatedTime = adjustedChunks.reduce(
      (sum, chunk) => sum + chunk.estimatedTime, 
      0
    );

    return course;
  }
}

// Singleton instance
export const courseService = new CourseService();

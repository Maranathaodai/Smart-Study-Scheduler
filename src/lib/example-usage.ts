// Example usage of the AI-powered content processing system

import { courseService } from './courseService';
import { generateIntelligentSchedules, createCustomStudySession } from './scheduler';
import { Course } from './types';

// Example: Creating a course with AI-powered content processing
export async function exampleCreateCourseWithAI() {
  try {
    // 1. Create a new course
    const course = await courseService.createCourse(
      'Advanced Machine Learning',
      'Computer Science',
      'hard',
      9,
      '#FF6B6B'
    );

    // 2. Add files to the course
    const courseWithFiles = await courseService.addFilesToCourse(course);
    console.log('Course created with files:', courseWithFiles.files.length);

    // 3. Process content with AI
    const processingResult = await courseService.processCourseContent(courseWithFiles);
    
    if (processingResult) {
      console.log('Content processed successfully!');
      console.log('Total chunks:', processingResult.chunks.length);
      console.log('Total estimated time:', processingResult.totalEstimatedTime, 'minutes');
      console.log('Key concepts:', processingResult.keyConcepts.slice(0, 5));
      
      // 4. Generate intelligent study schedule
      const schedule = generateIntelligentSchedules({
        courses: [courseWithFiles],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        studyDaysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
        maxStudyTimePerSession: 60, // 60 minutes
        preferredChunkSize: 'medium',
      });

      console.log('Generated schedule:', schedule.allSessions.length, 'sessions');
      return { course: courseWithFiles, schedule };
    }
  } catch (error) {
    console.error('Error creating course with AI:', error);
    throw error;
  }
}

// Example: Manual chunk adjustment
export async function exampleAdjustChunks(course: Course) {
  try {
    if (!course.processedChunks || course.processedChunks.length === 0) {
      throw new Error('Course has no processed chunks');
    }

    // Get the first chunk
    const firstChunk = course.processedChunks[0];
    console.log('Original chunk:', firstChunk.title, firstChunk.estimatedTime, 'minutes');

    // Split the chunk
    const adjustedCourse = await courseService.adjustCourseChunks(course, [
      {
        chunkId: firstChunk.id,
        action: 'split',
        parameters: { splitPoint: 0.5 }, // Split in the middle
      },
    ]);

    console.log('After splitting:', adjustedCourse.processedChunks?.length, 'chunks');
    return adjustedCourse;
  } catch (error) {
    console.error('Error adjusting chunks:', error);
    throw error;
  }
}

// Example: Creating a custom study session
export function exampleCreateCustomSession(course: Course) {
  if (!course.processedChunks || course.processedChunks.length === 0) {
    throw new Error('Course has no processed chunks');
  }

  // Select first 3 chunks for a custom session
  const selectedChunks = course.processedChunks.slice(0, 3);
  
  const customSession = createCustomStudySession(
    course.id,
    new Date(),
    selectedChunks
  );

  console.log('Custom session created:', customSession.totalEstimatedTime, 'minutes');
  console.log('Learning objectives:', customSession.learningObjectives.length);
  console.log('Assessment questions:', customSession.assessmentQuestions.length);
  
  return customSession;
}

// Example: Getting course progress
export async function exampleGetCourseProgress(course: Course) {
  try {
    const progress = await courseService.getCourseProgress(course);
    
    console.log('Course Progress:');
    console.log('- Total chunks:', progress.totalChunks);
    console.log('- Completed chunks:', progress.completedChunks);
    console.log('- Progress percentage:', progress.progressPercentage.toFixed(1), '%');
    console.log('- Estimated time remaining:', progress.estimatedTimeRemaining, 'minutes');
    
    return progress;
  } catch (error) {
    console.error('Error getting course progress:', error);
    throw error;
  }
}

// Example: Complete workflow
export async function exampleCompleteWorkflow() {
  try {
    console.log('🚀 Starting AI-powered content processing workflow...');
    
    // 1. Create course with AI processing
    const { course, schedule } = await exampleCreateCourseWithAI();
    console.log('✅ Course created and processed');
    
    // 2. Get progress
    const progress = await exampleGetCourseProgress(course);
    console.log('✅ Progress retrieved');
    
    // 3. Create custom session
    const customSession = exampleCreateCustomSession(course);
    console.log('✅ Custom session created');
    
    // 4. Adjust chunks (optional)
    const adjustedCourse = await exampleAdjustChunks(course);
    console.log('✅ Chunks adjusted');
    
    console.log('🎉 Complete workflow finished successfully!');
    
    return {
      course: adjustedCourse,
      schedule,
      progress,
      customSession,
    };
  } catch (error) {
    console.error('❌ Workflow failed:', error);
    throw error;
  }
}

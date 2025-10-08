import { Course, StudySession, StudyChunk } from './types';

type Difficulty = 'easy' | 'medium' | 'hard';

const difficultyWeight: Record<Difficulty, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
};

interface GenerateParams {
  courses: Course[];
  startDate: Date;
  endDate: Date;
  studyDaysOfWeek: number[]; // 0-6 (Sun-Sat)
  maxSlidesPerSession: number;
}

interface IntelligentGenerateParams {
  courses: Course[];
  startDate: Date;
  endDate: Date;
  studyDaysOfWeek: number[]; // 0-6 (Sun-Sat)
  maxStudyTimePerSession: number; // minutes
  preferredChunkSize: 'small' | 'medium' | 'large';
}

export interface GeneratedSchedules {
  byCourse: Record<string, StudySession[]>;
  allSessions: StudySession[];
}

// AI-driven session count calculation based on processed chunks
export function calculateAISessionCount(courses: Course[]): number {
  console.log('🧠 Calculating AI-driven session count...');
  
  const coursesWithChunks = courses.filter(course => 
    course.processedChunks && 
    course.processedChunks.length > 0 &&
    course.processingStatus === 'completed'
  );

  if (coursesWithChunks.length === 0) {
    console.log('No courses with processed chunks found');
    return 0;
  }

  let totalSessions = 0;
  
  for (const course of coursesWithChunks) {
    if (!course.processedChunks) continue;
    
    const chunkCount = course.processedChunks.length;
    console.log(`Course "${course.name}" has ${chunkCount} AI-processed chunks`);
    
    // Each chunk becomes one study session (AI's recommendation)
    totalSessions += chunkCount;
  }
  
  console.log(`🎯 AI recommends ${totalSessions} total study sessions`);
  return totalSessions;
}

// Helper function to estimate number of sessions that will be generated (legacy)
export function estimateSessionCount(
  courses: Course[],
  startDate: Date,
  endDate: Date,
  studyDaysOfWeek: number[],
  maxStudyTimePerSession: number,
  preferredChunkSize: 'small' | 'medium' | 'large'
): number {
  // Use AI-driven calculation if available
  const aiSessionCount = calculateAISessionCount(courses);
  if (aiSessionCount > 0) {
    return aiSessionCount;
  }
  
  // Fallback to original calculation
  const validDates: Date[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    if (studyDaysOfWeek.includes(cursor.getDay())) {
      validDates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (validDates.length === 0) return 0;

  const coursesWithChunks = courses.filter(course => 
    course.processedChunks && 
    course.processedChunks.length > 0 &&
    course.processingStatus === 'completed'
  );

  if (coursesWithChunks.length === 0) return 0;

  const chunkSizeMultipliers = {
    small: 0.7,
    medium: 1.0,
    large: 1.3,
  };
  const adjustedMaxTime = maxStudyTimePerSession * chunkSizeMultipliers[preferredChunkSize];

  let totalSessions = 0;
  const courseSessionsByDate: Record<string, number> = {};

  for (const course of coursesWithChunks) {
    if (!course.processedChunks) continue;

    const remainingChunks = course.processedChunks.filter(chunk => 
      !chunk.content.some(c => c.completed)
    );

    if (remainingChunks.length === 0) continue;

    let chunkIndex = 0;
    for (const date of validDates) {
      if (chunkIndex >= remainingChunks.length) break;

      const dateKey = date.toDateString();
      
      // Check if this date already has 2 courses
      if (courseSessionsByDate[dateKey] && courseSessionsByDate[dateKey] >= 2) {
        continue; // Skip this date, try next one
      }

      let sessionTime = 0;
      let sessionChunkCount = 0;

      // Add chunks until we reach the time limit
      while (chunkIndex < remainingChunks.length && sessionTime < adjustedMaxTime) {
        const chunk = remainingChunks[chunkIndex];
        if (sessionTime + chunk.estimatedTime <= adjustedMaxTime) {
          sessionTime += chunk.estimatedTime;
          sessionChunkCount++;
          chunkIndex++;
        } else {
          break;
        }
      }

      if (sessionChunkCount > 0) {
        totalSessions++;
        courseSessionsByDate[dateKey] = (courseSessionsByDate[dateKey] || 0) + 1;
      }
    }
  }

  return totalSessions;
}

export function generateSchedules(params: GenerateParams): GeneratedSchedules {
  const { courses, startDate, endDate, studyDaysOfWeek, maxSlidesPerSession } = params;

  const validDates: Date[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    if (studyDaysOfWeek.includes(cursor.getDay())) {
      validDates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (validDates.length === 0) {
    return { byCourse: {}, allSessions: [] };
  }

  const coursesState = courses.map((c) => {
    const remainingSlides = Math.max(0, c.totalSlides - c.completedSlides);
    const weight = difficultyWeight[c.difficulty as Difficulty] * (1 + (c.priority ?? 5) / 20);
    return { course: c, remainingSlides, weight };
  }).filter(c => c.remainingSlides > 0);

  const totalWeightedSlides = coursesState.reduce((acc, s) => acc + s.remainingSlides * s.weight, 0);
  if (totalWeightedSlides === 0) {
    return { byCourse: {}, allSessions: [] };
  }

  const sessionsByCourse: Record<string, StudySession[]> = {};

  let sessionAutoId = 1;
  for (const date of validDates) {
    for (const s of coursesState) {
      if (s.remainingSlides <= 0) continue;
      const fraction = (s.remainingSlides * s.weight) / totalWeightedSlides;
      const suggestedSlides = Math.max(1, Math.round(fraction * maxSlidesPerSession * coursesState.length));
      const slidesThisSession = Math.min(s.remainingSlides, Math.min(suggestedSlides, maxSlidesPerSession));
      if (slidesThisSession <= 0) continue;

      const session: StudySession = {
        id: `gen-${sessionAutoId++}`,
        courseId: s.course.id,
        date: new Date(date),
        slides: slidesThisSession,
        completed: false,
        completedSlides: 0,
        chunks: [],
        totalEstimatedTime: slidesThisSession * 5, // Estimate 5 minutes per slide
        completedChunks: 0,
        currentChunkIndex: 0,
        sessionProgress: 0,
        learningObjectives: [],
        assessmentQuestions: [],
      };

      if (!sessionsByCourse[s.course.id]) sessionsByCourse[s.course.id] = [];
      sessionsByCourse[s.course.id].push(session);
      s.remainingSlides -= slidesThisSession;
    }
  }

  let remainingTotal = coursesState.reduce((acc, s) => acc + s.remainingSlides, 0);
  outer: while (remainingTotal > 0) {
    for (const date of validDates) {
      for (const s of coursesState) {
        if (s.remainingSlides <= 0) continue;
        const slidesThisSession = Math.min(s.remainingSlides, maxSlidesPerSession);
        const session: StudySession = {
          id: `gen-${sessionAutoId++}`,
          courseId: s.course.id,
          date: new Date(date),
          slides: slidesThisSession,
          completed: false,
          completedSlides: 0,
          chunks: [],
          totalEstimatedTime: slidesThisSession * 5, // Estimate 5 minutes per slide
          completedChunks: 0,
          currentChunkIndex: 0,
          sessionProgress: 0,
          learningObjectives: [],
          assessmentQuestions: [],
        };
        if (!sessionsByCourse[s.course.id]) sessionsByCourse[s.course.id] = [];
        sessionsByCourse[s.course.id].push(session);
        s.remainingSlides -= slidesThisSession;
        remainingTotal -= slidesThisSession;
        if (remainingTotal <= 0) break outer;
      }
    }
    if (validDates.length === 0) break;
  }

  const allSessions: StudySession[] = Object.values(sessionsByCourse).flat();
  allSessions.sort((a, b) => a.date.getTime() - b.date.getTime());
  for (const id in sessionsByCourse) {
    sessionsByCourse[id].sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  return { byCourse: sessionsByCourse, allSessions };
}

// AI-driven intelligent scheduling that respects AI chunk recommendations
export function generateIntelligentSchedules(params: IntelligentGenerateParams): GeneratedSchedules {
  const { courses, startDate, endDate, studyDaysOfWeek, maxStudyTimePerSession, preferredChunkSize } = params;

  console.log('🧠 Generating AI-driven intelligent schedules...');
  console.log('📅 Date range:', startDate.toDateString(), 'to', endDate.toDateString());
  console.log('📚 Courses:', courses.length);

  const validDates: Date[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    if (studyDaysOfWeek.includes(cursor.getDay())) {
      validDates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (validDates.length === 0) {
    console.log('❌ No valid study dates found');
    return { byCourse: {}, allSessions: [] };
  }

  console.log('📅 Valid study dates:', validDates.length);

  // Filter courses that have processed chunks
  const coursesWithChunks = courses.filter(course => 
    course.processedChunks && 
    course.processedChunks.length > 0 &&
    course.processingStatus === 'completed'
  );

  if (coursesWithChunks.length === 0) {
    console.log('⚠️ No courses with processed chunks, falling back to original scheduling');
    return generateSchedules({
      courses,
      startDate,
      endDate,
      studyDaysOfWeek,
      maxSlidesPerSession: Math.floor(maxStudyTimePerSession / 2),
    });
  }

  console.log('✅ Courses with AI chunks:', coursesWithChunks.length);

  // Calculate chunk size preferences
  const chunkSizeMultipliers = {
    small: 0.7,
    medium: 1.0,
    large: 1.3,
  };
  const adjustedMaxTime = maxStudyTimePerSession * chunkSizeMultipliers[preferredChunkSize];
  
  console.log(`⏱️ Max study time per session: ${maxStudyTimePerSession}min`);
  console.log(`📏 Chunk size preference: ${preferredChunkSize} (multiplier: ${chunkSizeMultipliers[preferredChunkSize]})`);
  console.log(`⏱️ Adjusted max time: ${adjustedMaxTime}min`);

  const sessionsByCourse: Record<string, StudySession[]> = {};
  let sessionAutoId = 1;

  // Create intelligent sessions based on AI chunks, grouping them by time constraints
  const courseSessionsByDate: Record<string, Array<{courseId: string, session: StudySession}>> = {};

  for (const course of coursesWithChunks) {
    if (!course.processedChunks) continue;

    console.log(`📖 Processing course "${course.name}" with ${course.processedChunks.length} chunks`);
    
    // Debug: Show chunk details
    course.processedChunks.forEach((chunk, i) => {
      console.log(`  Chunk ${i + 1}: "${chunk.title}" - ${chunk.estimatedTime}min`);
    });

    const remainingChunks = course.processedChunks.filter(chunk => 
      !chunk.content.some(c => c.completed) // Simple completion check
    );

    if (remainingChunks.length === 0) {
      console.log(`✅ All chunks completed for "${course.name}"`);
      continue;
    }

    // Sort chunks by order and prerequisites
    const sortedChunks = sortChunksByDependencies(remainingChunks);
    console.log(`📋 Sorted ${sortedChunks.length} remaining chunks by dependencies`);

    // Group chunks into sessions based on time constraints
    let chunkIndex = 0;
    let sessionCount = 0;
    
    for (const date of validDates) {
      if (chunkIndex >= sortedChunks.length) break;

      const dateKey = date.toDateString();
      
      // Check if this date already has 2 courses (limit to prevent overload)
      // Only apply this constraint if we have multiple courses
      if (coursesWithChunks.length > 1 && courseSessionsByDate[dateKey] && courseSessionsByDate[dateKey].length >= 2) {
        continue; // Skip this date, try next one
      }

      const sessionChunks: StudyChunk[] = [];
      let sessionTime = 0;

      // Add chunks until we reach the time limit
      while (chunkIndex < sortedChunks.length && sessionTime < adjustedMaxTime) {
        const chunk = sortedChunks[chunkIndex];
        
        // If this is the first chunk in the session, add it even if it exceeds the time limit
        // to ensure all chunks get scheduled
        if (sessionChunks.length === 0 || sessionTime + chunk.estimatedTime <= adjustedMaxTime) {
          sessionChunks.push(chunk);
          sessionTime += chunk.estimatedTime;
          chunkIndex++;
        } else {
          break;
        }
      }

      if (sessionChunks.length > 0) {
        sessionCount++;
        const session: StudySession = {
          id: `ai-session-${course.id}-${sessionCount}`,
          courseId: course.id,
          date: new Date(date),
          slides: sessionChunks.length, // Keep for backward compatibility
          completed: false,
          completedSlides: 0, // Keep for backward compatibility
          chunks: sessionChunks,
          totalEstimatedTime: sessionTime,
          completedChunks: 0,
          currentChunkIndex: 0,
          sessionProgress: 0,
          learningObjectives: sessionChunks.flatMap(chunk => chunk.learningObjectives),
          assessmentQuestions: sessionChunks.flatMap(chunk => chunk.assessmentQuestions),
        };

        // Track sessions by date
        if (!courseSessionsByDate[dateKey]) {
          courseSessionsByDate[dateKey] = [];
        }
        courseSessionsByDate[dateKey].push({courseId: course.id, session});

        if (!sessionsByCourse[course.id]) sessionsByCourse[course.id] = [];
        sessionsByCourse[course.id].push(session);
        
        console.log(`  📝 Session ${sessionCount}: ${sessionChunks.length} chunks, ${sessionTime}min total`);
        sessionChunks.forEach((chunk, i) => {
          console.log(`    ${i + 1}. "${chunk.title}" (${chunk.estimatedTime}min)`);
        });
      }
    }
    
    console.log(`✅ Created ${sessionCount} sessions for "${course.name}" (${sortedChunks.length} chunks total)`);
    
    // If we still have remaining chunks after going through all dates, warn about it
    if (chunkIndex < sortedChunks.length) {
      const remainingCount = sortedChunks.length - chunkIndex;
      console.log(`⚠️ Warning: ${remainingCount} chunks couldn't be scheduled for "${course.name}" due to date constraints`);
    }
  }

  const allSessions: StudySession[] = Object.values(sessionsByCourse).flat();
  allSessions.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  for (const id in sessionsByCourse) {
    sessionsByCourse[id].sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  console.log(`🎯 Generated ${allSessions.length} total sessions across ${coursesWithChunks.length} courses`);

  return { byCourse: sessionsByCourse, allSessions };
}

// Helper function to sort chunks by dependencies and prerequisites
function sortChunksByDependencies(chunks: StudyChunk[]): StudyChunk[] {
  const sorted: StudyChunk[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(chunk: StudyChunk) {
    if (visiting.has(chunk.id)) {
      // Circular dependency detected, skip this chunk for now
      return;
    }
    if (visited.has(chunk.id)) {
      return;
    }

    visiting.add(chunk.id);

    // Visit prerequisite chunks first
    for (const prereq of chunk.prerequisites) {
      const prereqChunk = chunks.find(c => 
        c.keywords.includes(prereq) || c.title.toLowerCase().includes(prereq.toLowerCase())
      );
      if (prereqChunk && !visited.has(prereqChunk.id)) {
        visit(prereqChunk);
      }
    }

    visiting.delete(chunk.id);
    visited.add(chunk.id);
    sorted.push(chunk);
  }

  // Visit all chunks
  for (const chunk of chunks) {
    if (!visited.has(chunk.id)) {
      visit(chunk);
    }
  }

  return sorted;
}

// Function to create a study session from specific chunks
export function createCustomStudySession(
  courseId: string,
  date: Date,
  selectedChunks: StudyChunk[]
): StudySession {
  const totalTime = selectedChunks.reduce((sum, chunk) => sum + chunk.estimatedTime, 0);
  
  return {
    id: `custom-${Date.now()}`,
    courseId,
    date,
    slides: selectedChunks.length,
    completed: false,
    completedSlides: 0,
    chunks: selectedChunks,
    totalEstimatedTime: totalTime,
    completedChunks: 0,
    currentChunkIndex: 0,
    sessionProgress: 0,
    learningObjectives: selectedChunks.flatMap(chunk => chunk.learningObjectives),
    assessmentQuestions: selectedChunks.flatMap(chunk => chunk.assessmentQuestions),
  };
}



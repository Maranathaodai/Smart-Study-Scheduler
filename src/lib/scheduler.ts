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

// New intelligent scheduling function that works with AI-processed chunks
export function generateIntelligentSchedules(params: IntelligentGenerateParams): GeneratedSchedules {
  const { courses, startDate, endDate, studyDaysOfWeek, maxStudyTimePerSession, preferredChunkSize } = params;

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

  // Filter courses that have processed chunks
  const coursesWithChunks = courses.filter(course => 
    course.processedChunks && 
    course.processedChunks.length > 0 &&
    course.processingStatus === 'completed'
  );

  if (coursesWithChunks.length === 0) {
    // Fallback to original scheduling if no processed chunks available
    return generateSchedules({
      courses,
      startDate,
      endDate,
      studyDaysOfWeek,
      maxSlidesPerSession: Math.floor(maxStudyTimePerSession / 2), // Rough conversion
    });
  }

  // Calculate chunk size preferences
  const chunkSizeMultipliers = {
    small: 0.7,
    medium: 1.0,
    large: 1.3,
  };
  const adjustedMaxTime = maxStudyTimePerSession * chunkSizeMultipliers[preferredChunkSize];

  const sessionsByCourse: Record<string, StudySession[]> = {};
  let sessionAutoId = 1;

  // Create intelligent sessions based on chunks with max 2 courses per day
  const courseSessionsByDate: Record<string, Array<{courseId: string, session: StudySession}>> = {};

  for (const course of coursesWithChunks) {
    if (!course.processedChunks) continue;

    const remainingChunks = course.processedChunks.filter(chunk => 
      !chunk.content.some(c => c.completed) // Simple completion check
    );

    if (remainingChunks.length === 0) continue;

    // Sort chunks by order and prerequisites
    const sortedChunks = sortChunksByDependencies(remainingChunks);

    // Distribute chunks across available study dates
    let chunkIndex = 0;
    for (const date of validDates) {
      if (chunkIndex >= sortedChunks.length) break;

      const dateKey = date.toDateString();
      
      // Check if this date already has 2 courses
      if (courseSessionsByDate[dateKey] && courseSessionsByDate[dateKey].length >= 2) {
        continue; // Skip this date, try next one
      }

      const sessionChunks: StudyChunk[] = [];
      let sessionTime = 0;

      // Add chunks until we reach the time limit
      while (chunkIndex < sortedChunks.length && sessionTime < adjustedMaxTime) {
        const chunk = sortedChunks[chunkIndex];
        if (sessionTime + chunk.estimatedTime <= adjustedMaxTime) {
          sessionChunks.push(chunk);
          sessionTime += chunk.estimatedTime;
          chunkIndex++;
        } else {
          break;
        }
      }

      if (sessionChunks.length > 0) {
        const session: StudySession = {
          id: `intelligent-${sessionAutoId++}`,
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
      }
    }
  }

  const allSessions: StudySession[] = Object.values(sessionsByCourse).flat();
  allSessions.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  for (const id in sessionsByCourse) {
    sessionsByCourse[id].sort((a, b) => a.date.getTime() - b.date.getTime());
  }

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



import { Course, StudySession } from './types';

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



export interface Course {
  id: string;
  name: string;
  category: string;
  files: CourseFile[];
  totalSlides: number;
  completedSlides: number;
  createdAt: Date;
  color: string;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: number; // 1-10 scale for fine-tuning
}

export interface CourseFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export interface StudySession {
  id: string;
  courseId: string;
  date: Date;
  slides: number;
  completed: boolean;
  completedSlides: number;
}

export interface StudyPlan {
  id: string;
  courseId: string;
  startDate: Date;
  endDate: Date;
  studyDays: number[];
  maxSlidesPerSession: number;
  sessions: StudySession[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  university?: string;
  major?: string;
  year?: string;
  preferences: {
    darkMode: boolean;
    notifications: boolean;
    studyDays?: number[]; // 0-6 (Sun-Sat)
    maxSlidesPerSession?: number;
    scheduleStartDate?: string; // ISO
    scheduleEndDate?: string;   // ISO
  };
}

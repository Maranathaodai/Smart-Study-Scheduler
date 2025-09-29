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
  // New AI-powered content fields
  processedChunks?: StudyChunk[];
  totalEstimatedTime?: number;
  keyConcepts?: string[];
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  lastProcessed?: Date;
}

export interface CourseFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uri?: string; // File URI from DocumentPicker
}

export interface StudySession {
  id: string;
  courseId: string;
  date: Date;
  slides: number; // Keep for backward compatibility
  completed: boolean;
  completedSlides: number; // Keep for backward compatibility
  // New AI-powered session fields
  chunks: StudyChunk[];
  totalEstimatedTime: number;
  completedChunks: number;
  currentChunkIndex: number;
  sessionProgress: number; // 0-100 percentage
  learningObjectives: string[];
  assessmentQuestions: string[];
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
    // New AI-powered preferences
    maxStudyTimePerSession?: number; // minutes
    preferredChunkSize?: 'small' | 'medium' | 'large';
    enableAIChunking?: boolean;
    manualChunkAdjustment?: boolean;
  };
}

// New types for AI-powered content processing
export interface ProcessedContent {
  id: string;
  type: 'slide' | 'section' | 'concept' | 'image' | 'text';
  title: string;
  content: string;
  complexity: number; // 1-10 scale
  estimatedTime: number; // minutes
  dependencies: string[]; // prerequisite concepts
  keywords: string[];
  visualElements?: VisualElement[];
  sourceFile: string;
  pageNumber?: number;
  completed?: boolean; // Whether this content has been completed
}

export interface VisualElement {
  type: 'image' | 'diagram' | 'chart' | 'table';
  description: string;
  altText?: string;
}

export interface StudyChunk {
  id: string;
  title: string;
  content: ProcessedContent[];
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
  learningObjectives: string[];
  assessmentQuestions: string[];
  keywords: string[];
  order: number;
}

export interface ContentProcessingResult {
  chunks: StudyChunk[];
  totalEstimatedTime: number;
  keyConcepts: string[];
  processingMetadata: {
    fileType: string;
    processingTime: number;
    aiAnalysisUsed: boolean;
    manualAdjustments: boolean;
  };
}

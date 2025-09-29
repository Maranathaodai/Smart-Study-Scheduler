# AI-Powered Content Processing System

This document describes the intelligent content processing system implemented in the Smart Study Scheduler app.

## Overview

The AI-powered content processing system transforms uploaded course materials (PDFs, images, text files) into intelligent study chunks that respect conceptual boundaries and optimize learning efficiency.

## Architecture

### 1. OpenRouter Integration (`src/lib/openrouter.ts`)

- **Purpose**: Provides AI-powered content analysis using free models
- **Models Used**: `meta-llama/llama-3.2-3b-instruct:free`
- **Key Features**:
  - Text complexity analysis (1-10 scale)
  - Semantic content segmentation
  - Intelligent chunking with learning objectives
  - Key concept extraction
  - Study question generation

### 2. Content Processor (`src/lib/contentProcessor.ts`)

- **Purpose**: Handles file processing and AI-powered content analysis
- **Supported Formats**: PDF, images (JPG, PNG, GIF), text files (TXT, MD)
- **Key Features**:
  - Multi-format file processing
  - AI-powered semantic chunking
  - Fallback text splitting for reliability
  - Manual chunk boundary adjustments
  - Content complexity scoring

### 3. Course Service (`src/lib/courseService.ts`)

- **Purpose**: Manages course creation, file uploads, and content processing
- **Key Features**:
  - File upload handling with Expo Document Picker
  - Course creation and management
  - Content processing orchestration
  - Progress tracking
  - Manual chunk adjustments

### 4. Enhanced Scheduler (`src/lib/scheduler.ts`)

- **Purpose**: Creates intelligent study schedules based on processed content
- **Key Features**:
  - Chunk-based scheduling (replaces simple slide counting)
  - Dependency-aware chunk ordering
  - Time-based session optimization
  - Custom study session creation

## Data Models

### Enhanced Course Interface
```typescript
interface Course {
  // ... existing fields
  processedChunks?: StudyChunk[];
  totalEstimatedTime?: number;
  keyConcepts?: string[];
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  lastProcessed?: Date;
}
```

### Study Chunk Interface
```typescript
interface StudyChunk {
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
```

### Enhanced Study Session
```typescript
interface StudySession {
  // ... existing fields
  chunks: StudyChunk[];
  totalEstimatedTime: number;
  completedChunks: number;
  currentChunkIndex: number;
  sessionProgress: number;
  learningObjectives: string[];
  assessmentQuestions: string[];
}
```

## User Interface Enhancements

### 1. Enhanced Daily Study Screen (`src/screens/DailyStudyScreen.tsx`)

- **Chunk-based Navigation**: Navigate through intelligent content chunks
- **Learning Objectives Display**: Shows what students will learn in each chunk
- **Key Terms Highlighting**: Displays important concepts as tags
- **Time Estimates**: Shows estimated study time for each chunk
- **Progress Tracking**: Tracks completion of individual chunks

### 2. Chunk Adjustment Screen (`src/screens/ChunkAdjustmentScreen.tsx`)

- **Manual Chunk Control**: Users can split, merge, or resize chunks
- **Visual Chunk Overview**: See all chunks with difficulty and time estimates
- **Bulk Operations**: Adjust multiple chunks at once
- **Real-time Preview**: See changes before applying them

## Configuration

### Environment Variables
```bash
# Required: OpenRouter API Key
EXPO_PUBLIC_OPENROUTER_API_KEY=your_api_key_here
```

### Configuration File (`src/lib/config.ts`)
- Centralized configuration for all AI processing settings
- Configurable file size limits, chunk sizes, and processing parameters
- Validation functions to ensure proper setup

## Usage Flow

### 1. Course Creation
1. User creates a new course
2. Uploads files (PDF, images, text)
3. System processes files with AI
4. Creates intelligent study chunks
5. Generates learning objectives and assessment questions

### 2. Study Session Generation
1. System analyzes user preferences (study time, chunk size)
2. Creates intelligent schedule based on chunk dependencies
3. Respects conceptual boundaries and prerequisites
4. Optimizes for user's available study time

### 3. Study Session Execution
1. User navigates through intelligent chunks
2. Sees learning objectives and key terms
3. Tracks progress through chunk completion
4. System adapts future sessions based on performance

### 4. Manual Adjustments
1. User can access chunk adjustment screen
2. Split chunks that are too large
3. Merge chunks that are too small
4. Resize chunks to match study preferences

## Benefits

### For Students
- **Intelligent Content**: AI understands content structure and creates meaningful chunks
- **Optimized Learning**: Respects conceptual boundaries and prerequisites
- **Personalized Pacing**: Adapts to individual study preferences
- **Clear Objectives**: Know what to learn in each session
- **Flexible Control**: Manual adjustments when needed

### For Educators
- **Automatic Processing**: No manual content preparation required
- **Consistent Quality**: AI ensures consistent chunk quality
- **Learning Analytics**: Track student progress through intelligent metrics
- **Scalable Solution**: Handles any amount of content automatically

## Technical Considerations

### Performance
- **Caching**: Processed content is cached to avoid reprocessing
- **Fallback Systems**: Graceful degradation when AI is unavailable
- **Background Processing**: Content processing happens asynchronously

### Reliability
- **Error Handling**: Comprehensive error handling for all AI operations
- **Retry Logic**: Automatic retries for failed API calls
- **Offline Support**: Basic functionality works without internet

### Security
- **API Key Management**: Secure handling of API credentials
- **Content Privacy**: No content is stored on external servers
- **Local Processing**: All content processing happens locally when possible

## Future Enhancements

### Planned Features
1. **Visual Content Analysis**: Process images, diagrams, and charts
2. **Interactive Elements**: Generate quizzes and flashcards from content
3. **Spaced Repetition**: Integrate forgetting curves for optimal review timing
4. **Learning Analytics**: Advanced progress tracking and insights
5. **Collaborative Features**: Share and discuss chunks with peers

### Advanced AI Features
1. **Adaptive Difficulty**: Adjust chunk complexity based on performance
2. **Learning Style Optimization**: Customize chunks for different learning styles
3. **Content Summarization**: Generate summaries and key points
4. **Question Generation**: Create practice questions from content
5. **Concept Mapping**: Visual representation of concept relationships

## Troubleshooting

### Common Issues
1. **API Key Not Set**: Ensure `EXPO_PUBLIC_OPENROUTER_API_KEY` is configured
2. **Processing Failures**: Check file format and size limits
3. **Chunk Quality**: Use manual adjustments for better chunk boundaries
4. **Performance Issues**: Reduce file sizes or chunk complexity

### Support
- Check configuration in `src/lib/config.ts`
- Review error logs in console
- Use fallback text splitting if AI processing fails
- Contact support for persistent issues

## Conclusion

The AI-powered content processing system transforms the Smart Study Scheduler from a simple slide counter into an intelligent learning companion that understands content structure, optimizes study sessions, and adapts to individual learning needs. This system provides a foundation for advanced educational technology that can scale to any amount of content while maintaining high quality and user control.

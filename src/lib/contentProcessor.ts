import * as FileSystem from 'expo-file-system';
import { openRouterClient } from './openrouter';
import { CONFIG } from './config';

// Import types
import { StudyChunk, ContentProcessingResult } from './types';

export class ContentProcessor {
  private useOfflineMode: boolean = false;

  async processFile(filePath: string, fileName: string): Promise<ContentProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log('📄 Processing file:', fileName);
      
      // For demo purposes, create sample content
      const content = `Sample educational content from ${fileName}. This demonstrates the AI-powered content processing capabilities of the Smart Study Scheduler.`;
      
      const chunks = await this.createIntelligentChunks(content, fileName, 'file');
      const keyConcepts = this.extractBasicConcepts(content);

      const processingTime = Date.now() - startTime;

      return {
        chunks,
        totalEstimatedTime: chunks.reduce((sum, chunk) => sum + chunk.estimatedTime, 0),
        keyConcepts,
        processingMetadata: {
          fileType: 'file',
          processingTime,
          aiAnalysisUsed: !this.useOfflineMode,
          manualAdjustments: false
        }
      };

    } catch (error: any) {
      console.error('❌ Failed to process file:', fileName, error.message);
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  async processFileContent(content: string, fileName: string, fileType: string): Promise<ContentProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Processing file content for:', fileName);
      
      // Validate content
      if (!content || content.trim().length < 10) {
        throw new Error('Content is too short to process effectively');
      }

      console.log('✅ Content validation passed for', fileName);
      
      const chunks = await this.createIntelligentChunks(content, fileName, fileType);
      const keyConcepts = this.extractBasicConcepts(content);

      const processingTime = Date.now() - startTime;

      return {
        chunks,
        totalEstimatedTime: chunks.reduce((sum, chunk) => sum + chunk.estimatedTime, 0),
        keyConcepts,
        processingMetadata: {
          fileType,
          processingTime,
          aiAnalysisUsed: !this.useOfflineMode,
          manualAdjustments: false
        }
      };

    } catch (error: any) {
      console.error('❌ Failed to process file content:', error.message);
      throw new Error(`Failed to process content: ${error.message}`);
    }
  }

  async adjustChunkBoundaries(chunks: StudyChunk[], preferences: any): Promise<StudyChunk[]> {
    // Simple implementation - return chunks as-is for now
    console.log('🔧 Adjusting chunk boundaries for', chunks.length, 'chunks');
    return chunks;
  }

  private async createIntelligentChunks(content: string, fileName: string, fileType: string): Promise<StudyChunk[]> {
    try {
      console.log('🤖 Starting AI analysis for', fileName);
      
      if (!this.useOfflineMode) {
        try {
          const aiResponse = await openRouterClient.analyzeTextContent(content, 'chunking');
          
          if (aiResponse && aiResponse.trim().length > 10) {
            console.log('✅ AI analysis successful, response length:', aiResponse.length);
            
            // Try to parse as JSON first
            try {
              const parsed = JSON.parse(aiResponse);
              if (Array.isArray(parsed) && parsed.length > 0) {
                return this.convertAIResponseToChunks(parsed, fileName);
              }
            } catch (parseError) {
              console.log('⚠️ AI response is not JSON, creating single chunk');
              return this.createSingleChunkFromAI(aiResponse, fileName);
            }
          }
        } catch (aiError) {
          console.log('❌ AI processing failed, switching to offline mode:', aiError.message);
          this.useOfflineMode = true;
        }
      }

      // Fallback to offline processing
      return this.createOfflineChunks(content, fileName);

    } catch (error: any) {
      console.error('❌ Error creating chunks:', error.message);
      return this.createOfflineChunks(content, fileName);
    }
  }

  private convertAIResponseToChunks(aiChunks: any[], fileName: string): StudyChunk[] {
    return aiChunks.map((chunk, index) => ({
      id: `${fileName}-chunk-${index + 1}`,
      title: chunk.title || `Chunk ${index + 1}`,
      content: [{
        id: `${fileName}-content-${index + 1}`,
        type: 'text' as const,
        title: chunk.title || `Chunk ${index + 1}`,
        content: chunk.content || 'No content available',
        complexity: chunk.complexity || 5,
        estimatedTime: chunk.estimatedTime || 10,
        dependencies: chunk.prerequisites || [],
        keywords: chunk.keywords || [],
        sourceFile: fileName
      }],
      estimatedTime: chunk.estimatedTime || 10,
      difficulty: this.mapComplexityToDifficulty(chunk.complexity),
      prerequisites: chunk.prerequisites || [],
      learningObjectives: chunk.learningObjectives || [],
      assessmentQuestions: chunk.assessmentQuestions || [],
      keywords: chunk.keywords || [],
      order: index + 1
    }));
  }

  private createSingleChunkFromAI(aiResponse: string, fileName: string): StudyChunk[] {
    // Try to extract meaningful content from AI response
    const formattedContent = this.formatAIResponseForDisplay(aiResponse);
    
    return [{
      id: `${fileName}-chunk-1`,
      title: `AI Analysis: ${fileName}`,
      content: [{
        id: `${fileName}-content-1`,
        type: 'text' as const,
        title: `AI Analysis: ${fileName}`,
        content: formattedContent,
        complexity: 5,
        estimatedTime: Math.max(5, Math.min(20, Math.round(formattedContent.length / 200))),
        dependencies: [],
        keywords: this.extractBasicConcepts(formattedContent),
        sourceFile: fileName
      }],
      estimatedTime: Math.max(5, Math.min(20, Math.round(formattedContent.length / 200))),
      difficulty: 'medium' as const,
      prerequisites: [],
      learningObjectives: [],
      assessmentQuestions: [],
      keywords: this.extractBasicConcepts(formattedContent),
      order: 1
    }];
  }

  private formatAIResponseForDisplay(aiResponse: string): string {
    try {
      // First, try to extract content from JSON-like structure
      const cleaned = aiResponse.trim();
      
      // Check if this looks like JSON array content
      if (cleaned.includes('"title":') && cleaned.includes('"content":')) {
        // Try to extract the first chunk's content
        const titleMatch = cleaned.match(/"title":\s*"([^"]+)"/);
        const contentMatch = cleaned.match(/"content":\s*"([^"]+)"/);
        
        if (titleMatch && contentMatch) {
          const title = titleMatch[1];
          let content = contentMatch[1];
          
          // Clean up escaped newlines and formatting
          content = content.replace(/\\n/g, '\n');
          content = content.replace(/\\"/g, '"');
          content = content.replace(/\\\//g, '/');
          
          // Format as readable content
          return `# ${title}\n\n${content}`;
        }
      }
      
      // If it's just markdown content, clean it up
      if (cleaned.includes('##') || cleaned.includes('**')) {
        return cleaned.replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
      
      // Fallback: return cleaned response
      return cleaned;
      
    } catch (error) {
      console.log('⚠️ Error formatting AI response, using raw content');
      return aiResponse;
    }
  }

  private createOfflineChunks(content: string, fileName: string): StudyChunk[] {
    console.log('📚 Creating offline chunks for', fileName);
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const chunks: StudyChunk[] = [];

    if (sentences.length <= 3) {
      // Single chunk for short content
      chunks.push(this.createSingleOfflineChunk(content, fileName, 1));
    } else {
      // Split into multiple chunks
      const sentencesPerChunk = Math.max(2, Math.ceil(sentences.length / 3));
      
      for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
        const chunkSentences = sentences.slice(i, i + sentencesPerChunk);
        const chunkContent = chunkSentences.join('. ').trim() + '.';
        chunks.push(this.createSingleOfflineChunk(chunkContent, fileName, chunks.length + 1));
      }
    }

    console.log('✅ Created', chunks.length, 'offline chunks');
    return chunks;
  }

  private createSingleOfflineChunk(content: string, fileName: string, order: number): StudyChunk {
    const title = this.generateChunkTitle(content, order);
    
    return {
      id: `${fileName}-chunk-${order}`,
      title,
      content: [{
        id: `${fileName}-content-${order}`,
        type: 'text' as const,
        title,
        content: content.trim(),
        complexity: 5,
        estimatedTime: Math.max(3, Math.min(15, Math.round(content.length / 150))),
        dependencies: [],
        keywords: this.extractBasicConcepts(content),
        sourceFile: fileName
      }],
      estimatedTime: Math.max(3, Math.min(15, Math.round(content.length / 150))),
      difficulty: 'medium' as const,
      prerequisites: [],
      learningObjectives: [],
      assessmentQuestions: [],
      keywords: this.extractBasicConcepts(content),
      order
    };
  }

  private generateChunkTitle(content: string, order: number): string {
    const firstSentence = content.split(/[.!?]/)[0].trim();
    if (firstSentence.length > 10 && firstSentence.length < 60) {
      return firstSentence;
    }
    return `Section ${order}: ${content.substring(0, 40)}...`;
  }

  private extractBasicConcepts(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !this.isCommonWord(word));

    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use'
    ]);
    return commonWords.has(word);
  }

  private mapComplexityToDifficulty(complexity: number): 'easy' | 'medium' | 'hard' {
    if (complexity <= 3) return 'easy';
    if (complexity <= 7) return 'medium';
    return 'hard';
  }
}

// Singleton instance
export const contentProcessor = new ContentProcessor();
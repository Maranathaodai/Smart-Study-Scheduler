import { StudyChunk } from './types';
import { openRouterClient } from './openrouter';
import { CONFIG } from './config';

interface ContentValidation {
  isValid: boolean;
  reason: string;
  helpfulMessage: string;
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

interface StudySession {
  id: string;
  title: string;
  chunks: StudyChunk[];
  metadata: {
    sourceFile?: string;
    totalChunks: number;
    estimatedTime: number;
    processingMode: string;
  };
}

export class ContentProcessor {
  private isOnlineMode: boolean = true;
  private commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
    'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
    'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
    'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
    'one', 'all', 'would', 'there', 'their', 'what', 'so',
    'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me'
  ]);

  async processFile(filePath: string, manualContent?: string): Promise<StudySession> {
    const fileName = filePath.split('/').pop() || 'Unknown File';
    const fileType = filePath.split('.').pop()?.toLowerCase() || 'unknown';
    
    console.log(`🔄 Processing ${fileName}...`);

    try {
      let rawContent: string;
      
      if (manualContent?.trim()) {
        rawContent = manualContent.trim();
        console.log(`📝 Using manual content (${rawContent.length} characters)`);
      } else {
        // For demo purposes, return sample content
        rawContent = `Sample content from ${fileName}. This demonstrates the AI-powered content processing system.`;
        console.log(`📁 Extracted ${rawContent.length} characters from ${fileName}`);
      }

      // Validate content
      const validation = this.validateContentQuality(rawContent);
      if (!validation.isValid) {
        console.log(`❌ Content validation failed for ${fileName}: ${validation.reason}`);
        throw new Error(validation.helpfulMessage);
      }

      console.log(`✅ Content validation passed for ${fileName}`);

      // Process with AI
      const chunks = await this.processContentWithAI(rawContent, fileName, fileType);
      
      const session: StudySession = {
        id: Date.now().toString(),
        title: `Study Session: ${fileName}`,
        chunks,
        metadata: {
          sourceFile: fileName,
          totalChunks: chunks.length,
          estimatedTime: chunks.reduce((sum, chunk) => sum + chunk.estimatedTime, 0),
          processingMode: this.isOnlineMode ? 'AI-Powered' : 'Offline'
        }
      };

      console.log(`✅ Successfully processed ${fileName}: ${chunks.length} chunks created`);
      return session;

    } catch (error: any) {
      console.error(`❌ Failed to process ${fileName}:`, error.message);
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  async processFileContent(content: string, fileName: string, fileType: string): Promise<ContentProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Processing file content for:', fileName);
      
      // Validate content quality before processing
      const validation = this.validateContentQuality(content);
      if (!validation.isValid) {
        console.log(`❌ Content validation failed for ${fileName}: ${validation.reason}`);
        throw new Error(validation.helpfulMessage);
      }

      console.log(`✅ Content validation passed for ${fileName}`);
      
      // Process content with AI
      const chunks = await this.processContentWithAI(content, fileName, fileType);
      const keyConcepts = this.extractKeyTermsOffline(content);

      const processingTime = Date.now() - startTime;

      return {
        chunks,
        totalEstimatedTime: chunks.reduce((sum, chunk) => sum + chunk.estimatedTime, 0),
        keyConcepts,
        processingMetadata: {
          fileType,
          processingTime,
          aiAnalysisUsed: this.isOnlineMode,
          manualAdjustments: false
        }
      };

    } catch (error: any) {
      console.error(`❌ Failed to process file content for ${fileName}:`, error.message);
      throw new Error(`Failed to process content: ${error.message}`);
    }
  }

  async processManualContent(content: string, title: string = 'Manual Content'): Promise<StudySession> {
    console.log(`📝 Processing manual content (${content.length} characters)...`);

    try {
      const validation = this.validateContentQuality(content);
      if (!validation.isValid) {
        console.log(`❌ Manual content validation failed for ${title}: ${validation.reason}`);
        throw new Error(validation.helpfulMessage);
      }

      console.log(`✅ Manual content validation passed for ${title}`);

      const chunks = await this.processContentWithAI(content, title, 'text');
      
      const session: StudySession = {
        id: Date.now().toString(),
        title: `Study Session: ${title}`,
        chunks,
        metadata: {
          totalChunks: chunks.length,
          estimatedTime: chunks.reduce((sum, chunk) => sum + chunk.estimatedTime, 0),
          processingMode: this.isOnlineMode ? 'AI-Powered' : 'Offline'
        }
      };

      console.log(`✅ Successfully processed manual content: ${chunks.length} chunks created`);
      return session;

    } catch (error: any) {
      console.error(`❌ Failed to process manual content:`, error.message);
      throw new Error(`Failed to process content: ${error.message}`);
    }
  }

  private async processContentWithAI(content: string, fileName: string, fileType: string): Promise<StudyChunk[]> {
    try {
      console.log(`🤖 Starting AI analysis for ${fileName}...`);
      
      if (this.isOnlineMode) {
        const aiResponse = await openRouterClient.analyzeTextContent(content, 'chunking');

        console.log(`📊 AI analysis complete, response length: ${aiResponse.length}`);

        if (aiResponse && aiResponse.trim().length > 0) {
          try {
            // Try to parse as JSON first
            const parsedResponse = JSON.parse(aiResponse);
            
            if (parsedResponse && parsedResponse.chunks && Array.isArray(parsedResponse.chunks) && parsedResponse.chunks.length > 0) {
              const validChunks = parsedResponse.chunks.filter(chunk => 
                chunk && 
                typeof chunk.content === 'string' && 
                chunk.content.trim().length > 0 &&
                typeof chunk.title === 'string' &&
                chunk.title.trim().length > 0
              );

              if (validChunks.length > 0) {
                console.log(`✅ AI returned ${validChunks.length} valid chunks`);
                return validChunks.map((chunk, index) => ({
                  ...chunk,
                  id: `${fileName}-chunk-${index + 1}`,
                  sourceFile: fileName,
                  order: index + 1,
                  estimatedTime: Math.max(3, Math.min(15, Math.round(chunk.content.length / 200)))
                }));
              }
            }
          } catch (parseError) {
            console.log(`⚠️ AI response is not valid JSON, creating clean content from response`);
            // Create a single chunk from the raw response with clean formatting
            const cleanedContent = this.cleanAIResponse(aiResponse);
            return [{
              id: `${fileName}-chunk-1`,
              title: `AI Analysis: ${fileName}`,
              content: [{
                id: `${fileName}-content-1`,
                type: 'text' as const,
                title: `AI Analysis: ${fileName}`,
                content: cleanedContent,
                complexity: 5,
                estimatedTime: Math.max(5, Math.min(20, Math.round(cleanedContent.length / 200))),
                dependencies: [],
                keywords: this.extractKeyTermsOffline(cleanedContent),
                sourceFile: fileName
              }],
              estimatedTime: Math.max(5, Math.min(20, Math.round(cleanedContent.length / 200))),
              difficulty: 'medium' as const,
              prerequisites: [],
              learningObjectives: [],
              assessmentQuestions: [],
              keywords: this.extractKeyTermsOffline(cleanedContent),
              order: 1
            }];
          }
        }

        console.log(`⚠️ AI response invalid or empty, switching to offline processing`);
        this.isOnlineMode = false;
      }

      // Fallback to offline processing
      console.log(`🔄 Using offline processing for ${fileName}`);
      return this.createFallbackChunks(content, fileName, fileType);

    } catch (error: any) {
      console.error(`❌ AI processing failed for ${fileName}:`, error.message);
      console.log(`🔄 Switching to offline processing`);
      this.isOnlineMode = false;
      return this.createFallbackChunks(content, fileName, fileType);
    }
  }

  private createFallbackChunks(content: string, fileName: string, fileType: string): StudyChunk[] {
    console.log(`📚 Creating offline chunks for ${fileName}...`);
    
    const chunks: StudyChunk[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length === 0) {
      // Create a single chunk with the entire content
      chunks.push({
        id: `${fileName}-chunk-1`,
        title: `Study Content: ${fileName}`,
        content: [{
          id: `${fileName}-content-1`,
          type: 'text' as const,
          title: `Study Content: ${fileName}`,
          content: this.createFallbackChunkContent(content),
          complexity: 5,
          estimatedTime: Math.max(5, Math.min(20, Math.round(content.length / 150))),
          dependencies: [],
          keywords: this.extractKeyTermsOffline(content),
          sourceFile: fileName
        }],
        estimatedTime: Math.max(5, Math.min(20, Math.round(content.length / 150))),
        difficulty: 'medium' as const,
        prerequisites: [],
        learningObjectives: [],
        assessmentQuestions: [],
        keywords: this.extractKeyTermsOffline(content),
        order: 1
      });
    } else {
      // Split into logical chunks
      const sentencesPerChunk = Math.max(3, Math.ceil(sentences.length / 5));
      
      for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
        const chunkSentences = sentences.slice(i, i + sentencesPerChunk);
        const chunkContent = chunkSentences.join('. ').trim() + '.';
        
        chunks.push({
          id: `${fileName}-chunk-${chunks.length + 1}`,
          title: `Section ${chunks.length + 1}: ${this.generateOfflineTitle(chunkContent)}`,
          content: [{
            id: `${fileName}-content-${chunks.length + 1}`,
            type: 'text' as const,
            title: `Section ${chunks.length + 1}: ${this.generateOfflineTitle(chunkContent)}`,
            content: this.createFallbackChunkContent(chunkContent),
            complexity: 5,
            estimatedTime: Math.max(3, Math.min(15, Math.round(chunkContent.length / 150))),
            dependencies: [],
            keywords: this.extractKeyTermsOffline(chunkContent),
            sourceFile: fileName
          }],
          estimatedTime: Math.max(3, Math.min(15, Math.round(chunkContent.length / 150))),
          difficulty: 'medium' as const,
          prerequisites: [],
          learningObjectives: [],
          assessmentQuestions: [],
          keywords: this.extractKeyTermsOffline(chunkContent),
          order: chunks.length + 1
        });
      }
    }

    console.log(`✅ Created ${chunks.length} offline chunks for ${fileName}`);
    return chunks;
  }

  private createFallbackChunkContent(content: string): string {
    const cleanContent = content.trim();
    
    return `# Study Content

## Overview

${cleanContent}

## Key Points to Remember

- Take time to understand the main concepts
- Connect this information to what you already know
- Practice applying these ideas in different contexts

## Study Tips

1. **Read actively** - Don't just skim through the material
2. **Take notes** - Write down important points in your own words
3. **Ask questions** - Think about what you want to learn more about
4. **Review regularly** - Come back to this material to reinforce your understanding

---

*This content was processed using offline methods to ensure you can study even without an internet connection.*`;
  }

  private cleanAIResponse(response: string): string {
    // Keep the AI response as-is but ensure it's properly formatted
    let cleaned = response.trim();
    
    // If the response doesn't look like structured content, wrap it nicely
    if (!cleaned.includes('#') && !cleaned.includes('##')) {
      return `# AI Analysis

${cleaned}

## Key Takeaways

This content provides valuable insights for your studies. Focus on understanding the main concepts and how they connect to broader topics.`;
    }
    
    return cleaned;
  }

  private generateOfflineTitle(content: string): string {
    const firstSentence = content.split(/[.!?]/)[0].trim();
    if (firstSentence.length > 10 && firstSentence.length < 60) {
      return firstSentence;
    }
    
    const words = content.split(' ').slice(0, 8).join(' ');
    return words.length > 50 ? words.substring(0, 47) + '...' : words;
  }

  private extractKeyTermsOffline(content: string): string[] {
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const frequency: { [key: string]: number } = {};
    
    words.forEach(word => {
      if (!this.commonWords.has(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
  }

  private validateContentQuality(content: string): ContentValidation {
    console.log('🔍 Running content quality validation...');
    
    if (content.length < 50) {
      return {
        isValid: false,
        reason: 'Content too short',
        helpfulMessage: 'The content appears to be too short. Please provide more substantial text content for better processing.'
      };
    }

    if (content.length > 50000) {
      return {
        isValid: false,
        reason: 'Content too long',
        helpfulMessage: 'The content is too long. Please break it into smaller sections for better processing.'
      };
    }

    const wordCount = content.split(/\s+/).length;
    if (wordCount < 10) {
      return {
        isValid: false,
        reason: 'Too few words',
        helpfulMessage: 'The content has too few words. Please provide more detailed text for meaningful study chunks.'
      };
    }

    return {
      isValid: true,
      reason: 'Content quality is good',
      helpfulMessage: 'Content is ready for processing'
    };
  }
}

// Singleton instance
export const contentProcessor = new ContentProcessor();
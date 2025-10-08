import * as FileSystem from 'expo-file-system';
import { openRouterClient } from './openrouter';
import { CONFIG } from './config';
import { processingTracker } from './processingTracker';

// Enhanced content types
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

export class ContentProcessor {
  private openRouterClient = openRouterClient;
  private useOfflineMode: boolean = false; // Track if we should prefer offline processing
  private autoOfflineMode: boolean = false; // Track if offline mode was automatically triggered
  private lastAICheck: number = 0; // Timestamp of last AI availability check
  private aiCheckInterval: number = 5 * 60 * 1000; // Check AI every 5 minutes

  // Set offline mode (can be called when AI quota is exhausted)
  setOfflineMode(offline: boolean = true, automatic: boolean = false) {
    this.useOfflineMode = offline;
    this.autoOfflineMode = automatic;
    console.log(offline ? 
      `🔄 Switched to ${automatic ? 'automatic ' : ''}offline processing mode` : 
      '🤖 AI processing mode enabled'
    );
  }

  // Check if we should retry AI (for auto-offline mode only)
  private async shouldRetryAI(): Promise<boolean> {
    if (!this.autoOfflineMode || !this.useOfflineMode) {
      return false; // Only retry if we're in auto-offline mode
    }

    const now = Date.now();
    if (now - this.lastAICheck < this.aiCheckInterval) {
      return false; // Don't check too frequently
    }

    this.lastAICheck = now;
    console.log('🔍 Checking if AI is available again...');
    
    try {
      const aiWorking = await Promise.race([
        this.openRouterClient.testAI(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 5000))
      ]);

      if (aiWorking) {
        console.log('✅ AI is available again! Switching back to AI mode');
        this.setOfflineMode(false, false);
        return true;
      }
    } catch (error) {
      console.log('⚠️ AI still not available');
    }

    return false;
  }

  // Get current processing mode status for user feedback
  getProcessingStatus(): {
    mode: 'ai' | 'offline';
    isAutomatic: boolean;
    message: string;
  } {
    if (!this.useOfflineMode) {
      return {
        mode: 'ai',
        isAutomatic: false,
        message: '🤖 AI processing enabled - Enhanced content analysis'
      };
    }

    if (this.autoOfflineMode) {
      return {
        mode: 'offline',
        isAutomatic: true,
        message: '🔄 Auto-offline mode - Will retry AI periodically'
      };
    }

    return {
      mode: 'offline',
      isAutomatic: false,
      message: '📖 Offline mode - Manual processing enabled'
    };
  }

  async processFile(filePath: string, fileName: string): Promise<ContentProcessingResult> {
    const startTime = Date.now();
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    try {
      // Extract content from file with proper error handling
      let rawContent: string;
      let fileType: string;
      let extractionError: string | null = null;

      try {
        switch (fileExtension) {
          case 'pdf':
            rawContent = await this.extractPDFContent(filePath);
            fileType = 'pdf';
            break;
          case 'txt':
            rawContent = await this.extractTextContent(filePath);
            fileType = 'text';
            break;
          case 'md':
          case 'markdown':
            rawContent = await this.extractMarkdownContent(filePath);
            fileType = 'markdown';
            break;
          case 'docx':
          case 'doc':
            try {
              rawContent = await this.extractDocumentContent(filePath);
              fileType = 'document';
            } catch (docError) {
              extractionError = docError.message;
              throw docError;
            }
            break;
          case 'pptx':
          case 'ppt':
            try {
              rawContent = await this.extractPresentationContent(filePath);
              fileType = 'presentation';
            } catch (pptError) {
              extractionError = pptError.message;
              throw pptError;
            }
            break;
          case 'xlsx':
          case 'xls':
          case 'csv':
            try {
              rawContent = await this.extractSpreadsheetContent(filePath);
              fileType = 'spreadsheet';
            } catch (xlsError) {
              extractionError = xlsError.message;
              throw xlsError;
            }
            break;
          case 'jpg':
          case 'jpeg':
          case 'png':
          case 'gif':
          case 'bmp':
          case 'webp':
            try {
              rawContent = await this.extractImageContent(filePath);
              fileType = 'image';
            } catch (imgError) {
              extractionError = imgError.message;
              throw imgError;
            }
            break;
          case 'html':
          case 'htm':
            rawContent = await this.extractHTMLContent(filePath);
            fileType = 'html';
            break;
          default:
            rawContent = `Sample content from ${fileName}. This is a placeholder for the actual file content that would be extracted and processed by AI.`;
            fileType = 'text';
        }
      } catch (extractError) {
        // If content extraction fails, throw a user-friendly error
        throw new Error(`Could not process ${fileName}. ${extractionError || extractError.message}`);
      }

      // Validate content quality before processing
      const validation = this.validateContentQuality(rawContent);
      if (!validation.isValid) {
        console.log(`❌ Content validation failed for ${fileName}: ${validation.reason}`);
        throw new Error(validation.helpfulMessage);
      }

      console.log(`✅ Content validation passed for ${fileName}`);

      // Process content with AI using OpenAI model
      const chunks = await this.createIntelligentChunks(rawContent, fileName, fileType);
      const keyConcepts = await this.extractKeyConcepts(rawContent);

      const processingTime = Date.now() - startTime;

      return {
        chunks,
        totalEstimatedTime: chunks.reduce((sum, chunk) => sum + chunk.estimatedTime, 0),
        keyConcepts,
        processingMetadata: {
          fileType,
          processingTime,
          aiAnalysisUsed: true,
          manualAdjustments: false,
        },
      };
    } catch (error) {
      console.error('Content processing error:', error);
      processingTracker.setError(error.message);
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  async processFileContent(content: string, fileName: string, fileType: string): Promise<ContentProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log('Processing manual content for:', fileName);
      
      // Validate content quality before processing
      const validation = this.validateContentQuality(content);
      if (!validation.isValid) {
        console.log(`❌ Manual content validation failed for ${fileName}: ${validation.reason}`);
        throw new Error(validation.helpfulMessage);
      }

      console.log(`✅ Manual content validation passed for ${fileName}`);
      
      // Process content with AI using OpenAI model
      const chunks = await this.createIntelligentChunks(content, fileName, fileType);
      const keyConcepts = await this.extractKeyConcepts(content);

      const processingTime = Date.now() - startTime;

      return {
        chunks,
        totalEstimatedTime: chunks.reduce((sum, chunk) => sum + chunk.estimatedTime, 0),
        keyConcepts,
        processingMetadata: {
          fileType,
          processingTime,
          aiAnalysisUsed: true,
          manualAdjustments: false,
        },
      };
    } catch (error) {
      console.error('Content processing error:', error);
      throw new Error(`Failed to process content: ${error.message}`);
    }
  }

  private async extractPDFContent(filePath: string): Promise<string> {
    try {
      console.log('🔍 Extracting PDF content from:', filePath);
      
      // Import expo-file-system legacy API for file operations
      const FileSystem = require('expo-file-system/legacy');
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      console.log('✅ File exists, size:', fileInfo.size, 'bytes');
      
      // Read the file as base64 for AI processing
      const base64Content = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('✅ PDF file read successfully, base64 length:', base64Content.length);
      
      // Enhanced AI extraction with structure preservation
      try {
        console.log('🤖 Using enhanced AI to extract structured PDF content...');
        const extractedText = await this.openRouterClient.extractStructuredPDFContent(base64Content);
        
        // Check if AI returned instruction text instead of actual content
        if (extractedText && extractedText.trim().length > 50 && 
            !this.isInstructionResponse(extractedText)) {
          console.log('✅ Successfully extracted structured text from PDF using AI, length:', extractedText.length);
          console.log('📄 First 200 characters of extracted text:', extractedText.substring(0, 200));
          
          // Validate content relevance
          const isRelevant = await this.validateContentRelevance(extractedText, filePath);
          if (!isRelevant) {
            console.log('⚠️ Extracted content may not match the uploaded file');
            // Continue processing but log the warning
          }
          
          // Post-process extracted content to improve structure
          const processedContent = this.postProcessPDFContent(extractedText);
          return processedContent;
        } else if (extractedText && extractedText.trim().length > 200) {
          // If it's a long response but detected as instruction, it might actually be content
          console.log('⚠️ Long text detected but flagged as instruction - checking content...');
          console.log('📄 Content preview:', extractedText.substring(0, 300));
          
          // If it contains actual content patterns, use it anyway
          const hasActualContent = /\b(?:experience|education|skills|work|employment|university|degree|certification|project|responsibility|achievement)\b/i.test(extractedText);
          
          if (hasActualContent) {
            console.log('✅ Content contains real information despite instruction detection');
            const processedContent = this.postProcessPDFContent(extractedText);
            return processedContent;
          } else {
            console.log('❌ Confirmed instruction text, not actual content');
            throw new Error('Unable to extract meaningful content from PDF. The file may be corrupted, password-protected, or contain only images.');
          }
        } else {
          console.log('❌ AI returned instruction text instead of extracting PDF content');
          throw new Error('Unable to extract meaningful content from PDF. The file may be corrupted, password-protected, or contain only images.');
        }
      } catch (aiError) {
        console.log('Enhanced AI PDF extraction failed:', aiError.message);
        
        // If it's our detailed error message, preserve it
        if (aiError.message.includes('📄 PDF Processing Not Available') || 
            aiError.message.includes('Try these alternatives')) {
          throw aiError; // Preserve the detailed user-friendly message
        }
        
        // Otherwise, create a user-friendly message
        throw new Error(`📄 Couldn't process this PDF automatically.

Quick solutions:
• Copy text from the PDF and paste it manually
• Convert PDF to .txt file first
• Try uploading individual pages as images
• Use the manual text input option

The app works great with text files and copied content!`);
      }
      
      // Fallback: Try to read as text (some PDFs might have extractable text)
      try {
        const textContent = await FileSystem.readAsStringAsync(filePath, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        if (textContent && textContent.length > 100 && !textContent.includes('\x00')) {
          console.log('Successfully extracted text content from PDF using fallback');
          // Clean up and structure the raw text
          const cleanedContent = this.cleanRawPDFText(textContent);
          return cleanedContent;
        }
      } catch (textError) {
        console.log('Could not read PDF as text');
      }
      
      // If all methods fail, throw an error instead of returning instructions
      throw new Error(`📄 This PDF couldn't be processed automatically.

✨ Easy alternatives:
1. Copy and paste the text from your PDF
2. Convert PDF to a text (.txt) file  
3. Take screenshots and upload as images
4. Use the manual text input option

These methods work perfectly with the app!`);
      
    } catch (error) {
      console.error('Error extracting PDF content:', error);
      
      // If it's already a user-friendly error, preserve it
      if (error.message.includes('📄') || error.message.includes('✨')) {
        throw error;
      }
      
      // Otherwise, make it user-friendly
      throw new Error(`📄 PDF processing failed: ${error.message}

Try copying the text and pasting it manually instead!`);
    }
  }

  private async extractTextContent(filePath: string): Promise<string> {
    try {
      console.log('Extracting text content from:', filePath);
      
      // Import expo-file-system legacy API for file operations
      const FileSystem = require('expo-file-system/legacy');
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      console.log('Text file exists, size:', fileInfo.size, 'bytes');
      
      // Read the file as UTF-8 text
      const textContent = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      console.log('Text file read successfully, content length:', textContent.length);
      
      // Return the actual file content for AI analysis
      return textContent;
      
    } catch (error) {
      console.error('Error extracting text content:', error);
      throw new Error(`Failed to extract text content: ${error.message}`);
    }
  }

  private async extractMarkdownContent(filePath: string): Promise<string> {
    try {
      console.log('📝 Extracting markdown content from:', filePath);
      
      const FileSystem = require('expo-file-system/legacy');
      
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      console.log('✅ Markdown file exists, size:', fileInfo.size, 'bytes');
      
      const textContent = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      console.log('✅ Markdown file read successfully, content length:', textContent.length);
      
      // Preserve markdown structure while cleaning up
      const cleanedMarkdown = this.cleanMarkdownContent(textContent);
      
      return cleanedMarkdown;
      
    } catch (error) {
      console.error('Error extracting markdown content:', error);
      throw new Error(`Failed to extract markdown content: ${error.message}`);
    }
  }

  private async extractDocumentContent(filePath: string): Promise<string> {
    try {
      console.log('📄 Extracting document content from:', filePath);
      
      // For now, provide a helpful message since we need specialized libraries for Office docs
      const FileSystem = require('expo-file-system/legacy');
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      // Throw error instead of returning instruction content
      throw new Error(`Microsoft Word documents require manual processing. Please copy the text content from your document and paste it in the manual content field for better AI processing.`);
      
    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  private async extractPresentationContent(filePath: string): Promise<string> {
    try {
      console.log('🎨 Extracting presentation content from:', filePath);
      
      const FileSystem = require('expo-file-system/legacy');
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      // Throw error instead of returning instruction content
      throw new Error(`PowerPoint presentations require manual processing. Please copy the slide content and paste it in the manual content field for better AI processing.`);
      
    } catch (error) {
      console.error('Error processing presentation:', error);
      throw new Error(`Failed to process presentation: ${error.message}`);
    }
  }

  private async extractSpreadsheetContent(filePath: string): Promise<string> {
    try {
      console.log('📊 Extracting spreadsheet content from:', filePath);
      
      const FileSystem = require('expo-file-system/legacy');
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      // Throw error instead of returning instruction content
      throw new Error(`Spreadsheet files require manual processing. Please copy the relevant data and context from your spreadsheet and paste it in the manual content field for better AI processing.`);
      
    } catch (error) {
      console.error('Error processing spreadsheet:', error);
      throw new Error(`Failed to process spreadsheet: ${error.message}`);
    }
  }

  private async extractHTMLContent(filePath: string): Promise<string> {
    try {
      console.log('🌐 Extracting HTML content from:', filePath);
      
      const FileSystem = require('expo-file-system/legacy');
      
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      const htmlContent = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      console.log('✅ HTML file read successfully, content length:', htmlContent.length);
      
      // Extract text content from HTML
      const textContent = this.extractTextFromHTML(htmlContent);
      
      return textContent;
      
    } catch (error) {
      console.error('Error extracting HTML content:', error);
      throw new Error(`Failed to extract HTML content: ${error.message}`);
    }
  }

  private async extractImageContent(filePath: string): Promise<string> {
    try {
      console.log('🖼️ Extracting image content from:', filePath);
      
      // Import expo-file-system legacy API for file operations
      const FileSystem = require('expo-file-system/legacy');
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      console.log('✅ Image file exists, size:', fileInfo.size, 'bytes');
      
      // Read the image as base64
      const base64Content = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('✅ Image file read successfully, base64 length:', base64Content.length);
      
      // Enhanced AI image analysis with multiple approaches
      try {
        console.log('🤖 Using enhanced AI to analyze image content...');
        const imageAnalysis = await this.openRouterClient.analyzeImageContentEnhanced(base64Content);
        
        // Check for non-educational content response
        if (imageAnalysis.trim().toUpperCase() === 'NO_EDUCATIONAL_CONTENT_DETECTED') {
          throw new Error('This image does not contain educational content. Please upload images with study materials, diagrams, charts, text, or other educational content.');
        }
        
        // Check if AI returned instruction text instead of actual content
        if (imageAnalysis && imageAnalysis.trim().length > 50 && 
            !this.isInstructionResponse(imageAnalysis)) {
          console.log('✅ Successfully analyzed image content using enhanced AI, length:', imageAnalysis.length);
          console.log('📄 First 200 characters:', imageAnalysis.substring(0, 200));
          
          // Post-process the image analysis for better structure
          const processedContent = this.postProcessImageContent(imageAnalysis);
          return processedContent;
        } else {
          console.log('❌ Enhanced AI returned instruction text or non-educational response');
          throw new Error('Unable to extract educational content from this image. Please ensure the image contains study materials, diagrams, text, or other educational content.');
        }
      } catch (aiError) {
        // If it's our custom non-educational content error, re-throw it
        if (aiError.message.includes('does not contain educational content') || 
            aiError.message.includes('Please ensure the image contains')) {
          throw aiError;
        }
        
        console.log('Enhanced AI image analysis failed, trying standard analysis:', aiError.message);
        
        // Fallback to standard AI analysis
        try {
          const imageAnalysis = await this.openRouterClient.analyzeImageContent(base64Content);
          
          // Check if AI returned instruction text instead of actual content
          if (imageAnalysis && imageAnalysis.trim().length > 50 && 
              !this.isInstructionResponse(imageAnalysis)) {
            console.log('✅ Successfully analyzed image content using standard AI, length:', imageAnalysis.length);
            return this.postProcessImageContent(imageAnalysis);
          } else {
            console.log('❌ Standard AI also returned instruction text instead of analyzing image content');
            throw new Error('Unable to extract educational content from this image. Please ensure the image contains clear study materials, text, diagrams, or charts.');
          }
        } catch (standardAiError) {
          console.log('Standard AI image analysis also failed:', standardAiError.message);
          throw new Error('Failed to process image content. Please try uploading a clearer image with visible educational content.');
        }
      }
      
      // Enhanced fallback: Multi-method text extraction
      try {
        console.log('🔧 Attempting enhanced text extraction from image...');
        
        const extractedText = this.extractTextFromImageBase64(base64Content);
        
        if (extractedText && extractedText.length > 50) {
          console.log('✅ Successfully extracted text from image using enhanced methods');
          return `# Image Content Extracted

${extractedText}

---

*Note: This content was extracted from an image. Some formatting may not be perfect. For best results, consider using text-based files or manual content input.*`;
        }
      } catch (imageError) {
        console.log('Enhanced image text extraction failed:', imageError.message);
      }
      
      // If all methods fail, throw an error instead of returning instructions
      throw new Error(`Could not extract content from image. Please copy any text content and paste it in the manual content input field for better AI processing.`);
      
    } catch (error) {
      console.error('Error extracting image content:', error);
      throw new Error(`Failed to extract image content: ${error.message}`);
    }
  }


  private createFallbackChunks(content: string): StudyChunk[] {
    console.log('Creating fallback chunks from content...');
    
    // Enhanced fallback: intelligent text splitting
    const sections = this.splitContentIntelligently(content);
    const chunks: StudyChunk[] = [];
    
    sections.forEach((section, index) => {
      if (section.trim().length < 50) return; // Skip very short sections
      
      const keywords = this.extractKeywords(section);
      const estimatedTime = Math.max(10, Math.min(30, Math.round(section.length / 200))); // 10-30 minutes
      
      chunks.push({
        id: `fallback-chunk-${index}`,
        title: this.generateSectionTitle(section, index),
        content: [{
          id: `fallback-content-${index}`,
          type: 'text',
          title: this.generateSectionTitle(section, index),
          content: section,
          complexity: this.estimateComplexity(section),
          estimatedTime: estimatedTime,
          dependencies: [],
          keywords: keywords,
          sourceFile: 'unknown',
        }],
        estimatedTime: estimatedTime,
        difficulty: this.mapComplexityToDifficulty(this.estimateComplexity(section)),
        prerequisites: index > 0 ? [`Section ${index}`] : [],
        learningObjectives: this.generateFallbackObjectives(section),
        assessmentQuestions: this.generateFallbackQuestions(section),
        keywords: keywords,
        order: index,
      });
    });
    
    console.log(`Created ${chunks.length} fallback chunks`);
    return chunks;
  }


  // Generate a meaningful section title
  private generateSectionTitle(content: string, index: number): string {
    // Try to extract title from first line if it looks like a header
    const firstLine = content.split('\n')[0].trim();
    if (firstLine.length < 100 && firstLine.length > 5) {
      return firstLine.replace(/^#+\s*/, ''); // Remove markdown headers
    }
    
    // Extract key words for title
    const keywords = this.extractKeywords(content);
    if (keywords.length > 0) {
      return `${keywords[0]} - Section ${index + 1}`;
    }
    
    return `Section ${index + 1}`;
  }

  // Estimate content complexity
  private estimateComplexity(content: string): number {
    const words = content.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const longWords = words.filter(word => word.length > 8).length;
    const complexityRatio = longWords / words.length;
    
    // Score from 1-10 based on word length and complexity
    return Math.min(10, Math.max(1, Math.round(avgWordLength * complexityRatio * 2)));
  }

  // Map complexity score to difficulty level
  private mapComplexityToDifficulty(complexity: number): 'easy' | 'medium' | 'hard' {
    if (complexity <= 3) return 'easy';
    if (complexity <= 7) return 'medium';
    return 'hard';
  }

  // AI-powered content processing methods
  private async createIntelligentChunks(
    content: string, 
    fileName: string, 
    fileType: string
  ): Promise<StudyChunk[]> {
    try {
      // Check if we should retry AI first (for auto-offline mode)
      if (this.useOfflineMode) {
        const shouldRetry = await this.shouldRetryAI();
        if (!shouldRetry) {
          console.log('🔄 Using offline mode for content chunking');
          return this.createEnhancedFallbackChunks(content, fileName, fileType);
        }
        // If we get here, AI is available again and offline mode has been disabled
      }

      console.log('🔍 Creating intelligent chunks with AI...');
      console.log('📄 Original content length:', content.length);
      console.log('📄 First 300 characters of original content:', content.substring(0, 300));
      
      // ENHANCED VALIDATION: Comprehensive content quality check
      console.log('🔍 Performing comprehensive content validation...');
      
      const validationResult = this.validateContentQuality(content);
      if (!validationResult.isValid) {
        console.error(`❌ Content failed validation: ${validationResult.reason}`);
        console.log('📄 Creating helpful guidance instead of processing garbage');
        return this.createEnhancedFallbackChunks(
          validationResult.helpfulMessage, 
          fileName, 
          fileType
        );
      }
      
      console.log('✅ Content passed validation checks');
      
      // LEGACY VALIDATION: Check for meta-commentary (keeping for backwards compatibility)
      const contentLower = content.toLowerCase();
      const metaCommentaryIndicators = [
        'this appears to be',
        'it\'s possible it\'s',
        'it might be code',
        'without context',
        'impossible to tell',
        'large chunk of random text',
        'no clear meaning',
        'snippet of raw data',
        'could not extract',
        'failed to extract',
        'processing not available'
      ];
      
      const isMetaCommentary = metaCommentaryIndicators.some(indicator => 
        contentLower.includes(indicator)
      );
      
      if (isMetaCommentary) {
        console.error('❌ Content appears to be meta-commentary from AI processing, not actual educational content. Using enhanced fallback.');
        return this.createEnhancedFallbackChunks('This file could not be processed properly. Please try copying and pasting the text content manually for better results.', fileName, fileType);
      }
      
      // STEP 1: Preprocess content for consistent AI analysis
      const preprocessedContent = this.preprocessContentForAI(content, fileType);
      console.log('🔧 Preprocessed content length:', preprocessedContent.length);
      console.log('📄 First 300 characters of preprocessed content:', preprocessedContent.substring(0, 300));
      
      // Test AI connection first with timeout
      const aiWorking = await Promise.race([
        this.openRouterClient.testAI(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 10000))
      ]).catch((error) => {
        console.warn('🚨 AI connection test failed:', error.message);
        return false;
      });
      
      if (!aiWorking) {
        console.warn('⚠️ AI not available or too slow, switching to automatic offline mode');
        this.setOfflineMode(true, true); // Enable automatic offline mode
        return this.createEnhancedFallbackChunks(preprocessedContent, fileName, fileType);
      }
      
      // Use AI to analyze and chunk the preprocessed content with timeout
      const aiResponse = await Promise.race([
        this.openRouterClient.analyzeTextContent(preprocessedContent, 'chunking'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI processing timeout')), 25000))
      ]).catch((error) => {
        console.warn('🚨 AI processing failed:', error.message);
        
        // Check if this is a rate limit error and switch to automatic offline mode
        if (error.message?.includes('Rate limit exceeded') || 
            error.message?.includes('quota') || 
            error.message?.includes('timeout')) {
          console.log('💡 Switching to automatic offline mode due to AI limitations');
          this.setOfflineMode(true, true); // Enable automatic offline mode
        }
        
        return null;
      });
      
      if (!aiResponse) {
        console.log('🔄 Using enhanced offline processing instead');
        return this.createEnhancedFallbackChunks(preprocessedContent, fileName, fileType);
      }
      
      console.log('🤖 AI Response received (length):', (aiResponse as string).length);
      console.log('📄 First 500 characters of AI response:', (aiResponse as string).substring(0, 500));
      
      // Enhanced system prompt and error response detection
      const responseStart = (aiResponse as string).trim().substring(0, 400).toLowerCase();
      const systemPromptIndicators = [
        'you are an expert',
        'you are an educational',
        'chunking requirements',
        'transform educational content',
        'return only a json array',
        'chunk format for each chunk',
        'important: return only',
        'no explanations',
        'rules:',
        'guidelines:',
        'each chunk format:',
        'writing style guidelines',
        'return only the json array',
        'analyze this educational content'
      ];
      
      const containsSystemPrompt = systemPromptIndicators.some(indicator => 
        responseStart.includes(indicator)
      );
      
      if (containsSystemPrompt) {
        console.error('❌ AI returned system prompt instead of content. Using fallback.');
        return this.createEnhancedFallbackChunks(content, fileName, fileType);
      }
      
      // Parse AI response - handle both JSON and text responses
      let aiChunks;
      try {
        // First try to parse as JSON directly
        aiChunks = JSON.parse(aiResponse as string);
        if (!Array.isArray(aiChunks)) {
          throw new Error('AI response is not an array');
        }
      } catch (parseError) {
        console.log('Direct JSON parsing failed, trying to extract JSON from response...');
        
        // Try to extract JSON from prefixed responses - handle both arrays and single objects
        const arrayMatch = (aiResponse as string).match(/\[[\s\S]*?\]/);
        const objectMatch = (aiResponse as string).match(/\{[\s\S]*?\}/);
        
        if (arrayMatch) {
          try {
            aiChunks = JSON.parse(arrayMatch[0]);
            if (Array.isArray(aiChunks)) {
              console.log('Successfully extracted JSON array from prefixed response');
            } else {
              throw new Error('Extracted content is not an array');
            }
          } catch (extractError) {
            console.log('JSON array extraction failed, processing as structured text');
            aiChunks = this.parseTextResponseToChunks(aiResponse as string);
          }
        } else if (objectMatch) {
          try {
            const singleChunk = JSON.parse(objectMatch[0]);
            aiChunks = [singleChunk]; // Convert single object to array
            console.log('Successfully extracted single JSON object and converted to array');
          } catch (extractError) {
            console.log('JSON object extraction failed, processing as structured text');
            aiChunks = this.parseTextResponseToChunks(aiResponse as string);
          }
        } else {
          console.log('No JSON found in response, processing as structured text');
          aiChunks = this.parseTextResponseToChunks(aiResponse as string);
        }
      }

      // Convert AI response to StudyChunk objects
      const chunks: StudyChunk[] = aiChunks.map((chunk: any, index: number) => {
        // Handle case where AI returns strings instead of objects
        if (typeof chunk === 'string') {
          return {
            id: `chunk-${Date.now()}-${index}`,
            title: chunk,
            content: [{
              id: `content-${index}`,
              type: fileType as any,
              title: chunk,
              content: `# ${chunk}\n\nThis section covers: ${chunk}`,
              complexity: 5,
              estimatedTime: 15,
              dependencies: [],
              keywords: chunk.toLowerCase().split(' ').slice(0, 3),
              sourceFile: fileName,
            }],
            estimatedTime: 15,
            difficulty: this.mapComplexityToDifficulty(5),
            prerequisites: [],
            learningObjectives: [`Understand ${chunk}`],
            assessmentQuestions: [`What is ${chunk}?`],
            keywords: chunk.toLowerCase().split(' ').slice(0, 3),
            order: index,
          };
        }
        
        // Handle normal object format
        return {
          id: `chunk-${Date.now()}-${index}`,
          title: chunk.title || `Section ${index + 1}`,
          content: [{
            id: `content-${index}`,
            type: fileType as any,
            title: chunk.title || `Section ${index + 1}`,
            content: chunk.content || '',
            complexity: chunk.complexity || 5,
            estimatedTime: chunk.estimatedTime || 15,
            dependencies: chunk.dependencies || [],
            keywords: chunk.keywords || [],
            sourceFile: fileName,
          }],
          estimatedTime: chunk.estimatedTime || 15,
          difficulty: this.mapComplexityToDifficulty(chunk.complexity || 5),
          prerequisites: chunk.prerequisites || [],
          learningObjectives: chunk.learningObjectives || [],
          assessmentQuestions: chunk.assessmentQuestions || [],
          keywords: chunk.keywords || [],
          order: index,
        };
      });

      console.log(`✅ Created ${chunks.length} AI-powered chunks`);
      return chunks;
    } catch (error) {
      console.error('AI chunking failed, using enhanced fallback:', error);
      return this.createEnhancedFallbackChunks(content, fileName, fileType);
    }
  }

  private async extractKeyConcepts(content: string): Promise<string[]> {
    // Check if we should use offline mode
    if (this.useOfflineMode) {
      console.log('🔄 Using offline mode for key concept extraction');
      return this.extractBasicKeyConcepts(content);
    }

    try {
      console.log('🧠 Extracting key concepts with AI...');
      
      const aiResponse = await this.openRouterClient.extractKeyConcepts(content);
      
      // Try to parse JSON response
      let concepts;
      try {
        concepts = JSON.parse(aiResponse);
      } catch (parseError) {
        // If JSON parsing fails, try to extract concepts from text response
        const lines = aiResponse.split('\n').filter(line => line.trim());
        concepts = lines.map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim()).filter(concept => concept.length > 0);
      }
      
      if (Array.isArray(concepts)) {
        console.log(`✅ Extracted ${concepts.length} key concepts with AI`);
        return concepts.slice(0, 10); // Limit to 10 concepts
      } else {
        throw new Error('AI response is not an array');
      }
    } catch (error) {
      console.error('❌ AI key concept extraction failed:', error.message);
      
      // Check for rate limit errors and switch to automatic offline mode
      if (error.message && (error.message.includes('Rate limit exceeded') || error.message.includes('free-models-per-day'))) {
        console.log('📵 AI quota exhausted, switching to automatic offline mode');
        this.setOfflineMode(true, true); // Enable automatic offline mode
      }
      
      // Use enhanced offline extraction as fallback
      return this.extractBasicKeyConcepts(content);
    }
  }

  // Parse text response from AI into structured chunks
  private parseTextResponseToChunks(textResponse: string): any[] {
    try {
      console.log('Parsing OpenAI text response:', textResponse.substring(0, 200) + '...');
      
      // Check if response is empty or too short
      if (!textResponse || textResponse.trim().length < 50) {
        console.log('AI response is too short or empty, creating fallback chunks');
        return this.createFallbackChunksFromResponse(textResponse);
      }
      
      // Split the response into sections based on common patterns
      const sections = textResponse.split(/\n(?=\d+\.|\*\*|##|###)/);
      
      const chunks = sections.map((section, index) => {
        // Extract title from the section
        const titleMatch = section.match(/^(?:\d+\.\s*)?\*?([^*\n]+?)\*?$/m);
        const title = titleMatch ? titleMatch[1].trim() : `Section ${index + 1}`;
        
        // Extract learning objectives
        const objectivesMatch = section.match(/Learning Objectives:([\s\S]*?)(?=Assessment Questions:|$)/i);
        const learningObjectives = objectivesMatch 
          ? objectivesMatch[1].split('\n')
              .map(line => line.replace(/^[-*]\s*/, '').trim())
              .filter(line => line.length > 0)
          : [];
        
        // Extract assessment questions
        const questionsMatch = section.match(/Assessment Questions:([\s\S]*?)(?=\d+\.|$)/i);
        const assessmentQuestions = questionsMatch 
          ? questionsMatch[1].split('\n')
              .map(line => line.replace(/^[-*]\s*/, '').trim())
              .filter(line => line.length > 0)
          : [];
        
        // Clean up the content (remove objectives and questions sections)
        let content = section.replace(/^(?:\d+\.\s*)?\*?([^*\n]+?)\*?\s*/m, '').trim();
        content = content.replace(/Learning Objectives:[\s\S]*?(?=Assessment Questions:|$)/i, '').trim();
        content = content.replace(/Assessment Questions:[\s\S]*?$/i, '').trim();
        
        return {
          title: title,
          content: content,
          estimatedTime: 15, // Default time
          complexity: 5, // Default complexity
          learningObjectives: learningObjectives,
          keywords: this.extractKeywordsFromText(content),
          assessmentQuestions: assessmentQuestions,
          prerequisites: []
        };
      }).filter(chunk => chunk.content.length > 20); // Filter out empty chunks
      
      // If no chunks were created, create fallback chunks
      if (chunks.length === 0) {
        console.log('No valid chunks found, creating fallback chunks');
        return this.createFallbackChunksFromResponse(textResponse);
      }
      
      console.log(`Created ${chunks.length} chunks from OpenAI text response`);
      return chunks;
    } catch (error) {
      console.error('Error parsing OpenAI text response:', error);
      return this.createFallbackChunksFromResponse(textResponse);
    }
  }

  // Create fallback chunks when AI response is empty or invalid
  private createFallbackChunksFromResponse(textResponse: string): any[] {
    console.log('Creating emergency fallback chunks - AI response was empty or invalid');
    
    // Create a basic but well-formatted chunk as emergency fallback
    return [
      {
        title: "Study Material Overview",
        content: "# Study Material Overview\\n\\n## What You Need to Know\\n\\nYour study content has been processed and is ready for review. This material contains important concepts that will help you understand the topic better.\\n\\n## Key Areas to Focus On\\n\\n- **Main Concepts**: Review the core ideas presented in the material\\n- **Important Details**: Pay attention to specific facts and figures\\n- **Applications**: Think about how these concepts apply in real situations\\n- **Connections**: Consider how this relates to other topics you've studied\\n\\n## Study Approach\\n\\n1. **Read Actively**: Don't just skim - engage with the material\\n2. **Take Notes**: Write down important points in your own words\\n3. **Ask Questions**: Think critically about what you're learning\\n4. **Practice**: Apply the concepts through exercises or examples\\n\\n## Summary\\n\\nThis study session covers essential material for your learning goals. Take your time to understand each concept thoroughly before moving on.\\n\\n---\\n\\n*Note: This content was processed using offline methods. For enhanced AI analysis, ensure you have a stable internet connection.*",
        estimatedTime: 15,
        complexity: 5,
        learningObjectives: [
          "Understand the main concepts in the study material",
          "Apply knowledge through active learning techniques"
        ],
        keywords: ["study", "concepts", "learning", "review"],
        assessmentQuestions: [
          "What are the main concepts covered in this material?",
          "How can you apply these concepts in practice?",
          "What questions do you have about this topic?"
        ],
        prerequisites: []
      }
    ];
  }

  private extractKeywordsFromText(text: string): string[] {
    // Extract keywords from text (simple approach)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'there', 'when', 'your', 'can', 'said', 'into', 'more', 'than', 'other', 'some', 'what', 'time', 'very', 'when', 'much', 'new', 'way', 'may', 'say', 'use', 'man', 'day', 'too', 'any', 'same', 'tell', 'boy', 'follow', 'came', 'want', 'show', 'also', 'around', 'form', 'three', 'small', 'set', 'put', 'end', 'why', 'again', 'turn', 'here', 'just', 'where', 'most', 'through', 'back', 'much', 'before', 'move', 'right', 'boy', 'old', 'too', 'same', 'she', 'all', 'there', 'when', 'up', 'use', 'word', 'how', 'said', 'an', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'into', 'him', 'time', 'has', 'two', 'more', 'go', 'no', 'way', 'could', 'my', 'than', 'first', 'water', 'been', 'call', 'who', 'oil', 'sit', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part'].includes(word));
    
    // Return unique words, limited to 5
    return [...new Set(words)].slice(0, 5);
  }


  private extractKeywordsOffline(content: string): string[] {
    // Enhanced offline keyword extraction
    const words = content.toLowerCase().split(/\s+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'from', 'into', 'during', 'including', 'until', 'against', 'among', 'throughout', 'despite', 'towards', 'upon', 'concerning']);
    
    const keywords = [...new Set(words.filter(word => 
      word.length > 3 && 
      !commonWords.has(word) && 
      /^[a-zA-Z]+$/.test(word)
    ))].slice(0, 10);
    
    return keywords;
  }


  // Generate fallback learning objectives from content
  private generateFallbackObjectives(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const objectives = [];
    
    // Extract key concepts and create modern objectives
    const keywords = this.extractKeywords(content);
    if (keywords.length > 0) {
      objectives.push(`🎯 Master the concept of ${keywords[0]}`);
    }
    
    if (sentences.length > 0) {
      const mainTopic = sentences[0].trim().substring(0, 40);
      objectives.push(`🧠 Understand ${mainTopic}...`);
    }
    
    if (keywords.length > 1) {
      objectives.push(`🚀 Apply ${keywords[1]} in real-world scenarios`);
    }
    
    // Add general objectives if we don't have enough specific ones
    if (objectives.length < 2) {
      objectives.push('⚡ Connect concepts to practical applications');
    }
    
    return objectives.slice(0, 3); // Return max 3 objectives
  }

  // Generate fallback assessment questions from content
  private generateFallbackQuestions(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keywords = this.extractKeywords(content);
    const questions = [];
    
    if (keywords.length > 0) {
      questions.push(`💭 What is ${keywords[0]} and how would you apply it?`);
    }
    
    if (sentences.length > 0) {
      questions.push(`🔥 Can you explain the main concepts in your own words?`);
    }
    
    if (keywords.length > 1) {
      questions.push(`⚡ How does ${keywords[0]} connect to ${keywords[1]} in practice?`);
    }
    
    // Add engaging fallback questions
    if (questions.length < 2) {
      questions.push('🧠 What surprised you most about this content?');
      questions.push('🚀 How would you teach this to someone else?');
    }
    
    return questions.slice(0, 3); // Return max 3 questions
  }

  // Method to allow manual adjustment of chunk boundaries
  async adjustChunkBoundaries(
    chunks: StudyChunk[], 
    adjustments: Array<{
      chunkId: string;
      action: 'split' | 'merge' | 'resize';
      parameters: any;
    }>
  ): Promise<StudyChunk[]> {
    let adjustedChunks = [...chunks];

    for (const adjustment of adjustments) {
      const chunkIndex = adjustedChunks.findIndex(c => c.id === adjustment.chunkId);
      if (chunkIndex === -1) continue;

      switch (adjustment.action) {
        case 'split':
          // Split chunk into smaller parts
          const splitChunks = this.splitChunk(adjustedChunks[chunkIndex], adjustment.parameters);
          adjustedChunks.splice(chunkIndex, 1, ...splitChunks);
          break;
          
        case 'merge':
          // Merge with adjacent chunk
          if (chunkIndex < adjustedChunks.length - 1) {
            const mergedChunk = this.mergeChunks(
              adjustedChunks[chunkIndex], 
              adjustedChunks[chunkIndex + 1]
            );
            adjustedChunks.splice(chunkIndex, 2, mergedChunk);
          }
          break;
          
        case 'resize':
          // Adjust chunk size
          adjustedChunks[chunkIndex] = this.resizeChunk(
            adjustedChunks[chunkIndex], 
            adjustment.parameters
          );
          break;
      }
    }

    // Reorder chunks
    adjustedChunks.forEach((chunk, index) => {
      chunk.order = index;
    });

    return adjustedChunks;
  }

  private splitChunk(chunk: StudyChunk, parameters: any): StudyChunk[] {
    // Implementation for splitting a chunk
    const splitPoint = parameters.splitPoint || 0.5;
    const contentLength = chunk.content[0].content.length;
    const splitIndex = Math.floor(contentLength * splitPoint);
    
    const content1 = chunk.content[0].content.substring(0, splitIndex);
    const content2 = chunk.content[0].content.substring(splitIndex);
    
    return [
      {
        ...chunk,
        id: `${chunk.id}-1`,
        title: `${chunk.title} (Part 1)`,
        content: [{
          ...chunk.content[0],
          content: content1,
          estimatedTime: Math.floor(chunk.estimatedTime * splitPoint),
        }],
        estimatedTime: Math.floor(chunk.estimatedTime * splitPoint),
      },
      {
        ...chunk,
        id: `${chunk.id}-2`,
        title: `${chunk.title} (Part 2)`,
        content: [{
          ...chunk.content[0],
          content: content2,
          estimatedTime: Math.ceil(chunk.estimatedTime * (1 - splitPoint)),
        }],
        estimatedTime: Math.ceil(chunk.estimatedTime * (1 - splitPoint)),
      },
    ];
  }

  private mergeChunks(chunk1: StudyChunk, chunk2: StudyChunk): StudyChunk {
    return {
      ...chunk1,
      title: `${chunk1.title} & ${chunk2.title}`,
      content: [...chunk1.content, ...chunk2.content],
      estimatedTime: chunk1.estimatedTime + chunk2.estimatedTime,
      learningObjectives: [...chunk1.learningObjectives, ...chunk2.learningObjectives],
      assessmentQuestions: [...chunk1.assessmentQuestions, ...chunk2.assessmentQuestions],
      keywords: [...new Set([...chunk1.keywords, ...chunk2.keywords])],
    };
  }

  private resizeChunk(chunk: StudyChunk, parameters: any): StudyChunk {
    const newSize = parameters.newSize || chunk.estimatedTime;
    return {
      ...chunk,
      estimatedTime: newSize,
      content: chunk.content.map(c => ({
        ...c,
        estimatedTime: newSize,
      })),
    };
  }

  // Enhanced fallback chunking that maintains quality similar to manual content
  private createEnhancedFallbackChunks(
    content: string, 
    fileName: string, 
    fileType: string
  ): StudyChunk[] {
    console.log('🔧 Using enhanced fallback chunking method with quality preservation');
    
    try {
      // STEP 1: Apply additional content preprocessing for fallback
      const enhancedContent = this.enhanceContentForFallback(content, fileType);
      
      // STEP 2: Intelligent content analysis without AI
      const contentAnalysis = this.analyzeContentStructure(enhancedContent);
      
      // STEP 3: Create chunks using advanced heuristics
      let chunks: StudyChunk[] = [];
      
      if (contentAnalysis.hasHeaders) {
        console.log('📑 Using header-based chunking');
        chunks = this.createHeaderBasedChunks(enhancedContent, fileName, fileType, contentAnalysis);
      } else if (contentAnalysis.hasLists) {
        console.log('📋 Using list-based chunking');
        chunks = this.createListBasedChunks(enhancedContent, fileName, fileType, contentAnalysis);
      } else if (contentAnalysis.hasParagraphs) {
        console.log('📄 Using enhanced paragraph-based chunking');
        chunks = this.createIntelligentParagraphChunks(enhancedContent, fileName, fileType, contentAnalysis);
      } else {
        console.log('📝 Using intelligent sentence-based chunking');
        chunks = this.createIntelligentSentenceChunks(enhancedContent, fileName, fileType, contentAnalysis);
      }
      
      // STEP 4: Post-process chunks for quality
      chunks = this.enhanceChunkQuality(chunks, contentAnalysis);
      
      // STEP 5: Ensure minimum quality standards
      chunks = this.ensureChunkQuality(chunks, fileName);
      
      console.log(`✅ Created ${chunks.length} high-quality fallback chunks`);
      return chunks;
      
    } catch (error) {
      console.error('Enhanced fallback chunking failed, using basic method:', error);
      return this.createBasicFallbackChunks(content, fileName, fileType);
    }
  }

  // Enhance content specifically for fallback processing
  private enhanceContentForFallback(content: string, fileType: string): string {
    let enhanced = content;
    
    // Add structure markers based on common patterns
    enhanced = enhanced
      .replace(/^([A-Z][^.\n]{10,80})$/gm, '## $1') // Convert title-like lines to headers
      .replace(/^(\d+\.\s+[A-Z][^.\n]{5,})/gm, '### $1') // Convert numbered sections to subheaders
      .replace(/^([A-Z\s]{5,30}):?\s*$/gm, '### $1') // Convert all-caps lines to headers
      .replace(/([.!?])\s*\n\s*([A-Z][a-z])/g, '$1\n\n$2') // Add paragraph breaks
      .replace(/\n{4,}/g, '\n\n\n'); // Limit excessive breaks
    
    return enhanced;
  }

  // Analyze content structure without AI
  private analyzeContentStructure(content: string): any {
    const lines = content.split('\n');
    
    return {
      hasHeaders: /^#+\s+/m.test(content) || /^[A-Z\s]{10,50}$/m.test(content),
      hasParagraphs: content.split('\n\n').length >= 3,
      hasLists: /^\s*[-*+•]\s+/m.test(content) || /^\s*\d+\.\s+/m.test(content),
      hasCodeBlocks: /```/.test(content) || /`[^`]+`/.test(content),
      totalLength: content.length,
      lineCount: lines.length,
      averageLineLength: lines.reduce((sum, line) => sum + line.length, 0) / lines.length,
      complexity: this.estimateContentComplexity(content),
      topics: this.extractTopicHints(content),
      keyTerms: this.extractKeyTermsOffline(content)
    };
  }

  // Create chunks based on headers
  private createHeaderBasedChunks(content: string, fileName: string, fileType: string, analysis: any): StudyChunk[] {
    const chunks: StudyChunk[] = [];
    const sections = content.split(/\n(?=#+\s+)/);
    
    sections.forEach((section, index) => {
      if (section.trim().length < 100) return; // Skip very short sections
      
      const headerMatch = section.match(/^(#+)\s+(.+)/);
      const title = headerMatch ? headerMatch[2] : `Section ${index + 1}`;
      const headerLevel = headerMatch ? headerMatch[1].length : 1;
      
      // Create enhanced content with better formatting
      const enhancedContent = this.formatSectionContent(section, title, headerLevel);
      
      chunks.push(this.createAdvancedChunk(enhancedContent, title, index, fileName, fileType, analysis));
    });
    
    return chunks;
  }

  // Create chunks based on lists
  private createListBasedChunks(content: string, fileName: string, fileType: string, analysis: any): StudyChunk[] {
    const chunks: StudyChunk[] = [];
    const listSections = this.extractListSections(content);
    
    listSections.forEach((section, index) => {
      if (section.content.length < 100) return;
      
      const enhancedContent = this.formatListContent(section);
      chunks.push(this.createAdvancedChunk(enhancedContent, section.title, index, fileName, fileType, analysis));
    });
    
    return chunks;
  }

  // Create intelligent paragraph-based chunks
  private createIntelligentParagraphChunks(content: string, fileName: string, fileType: string, analysis: any): StudyChunk[] {
    const chunks: StudyChunk[] = [];
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const paragraph of paragraphs) {
      const shouldStartNewChunk = 
        currentChunk.length > 600 || 
        (currentChunk.length > 300 && this.isTopicBoundary(currentChunk, paragraph));
      
      if (shouldStartNewChunk && currentChunk.trim()) {
        const title = this.generateIntelligentTitle(currentChunk, analysis.keyTerms);
        const enhancedContent = this.formatChunkContent(currentChunk, title);
        chunks.push(this.createAdvancedChunk(enhancedContent, title, chunkIndex, fileName, fileType, analysis));
        
        currentChunk = paragraph;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
      const title = this.generateIntelligentTitle(currentChunk, analysis.keyTerms);
      const enhancedContent = this.formatChunkContent(currentChunk, title);
      chunks.push(this.createAdvancedChunk(enhancedContent, title, chunkIndex, fileName, fileType, analysis));
    }
    
    return chunks;
  }

  // Create intelligent sentence-based chunks
  private createIntelligentSentenceChunks(content: string, fileName: string, fileType: string, analysis: any): StudyChunk[] {
    const chunks: StudyChunk[] = [];
    const sentences = content.split(/[.!?]+\s+/).filter(s => s.trim().length > 20);
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const sentence of sentences) {
      const fullSentence = sentence.trim() + '.';
      
      if (currentChunk.length > 500 && currentChunk.length + fullSentence.length > 800) {
        const title = this.generateIntelligentTitle(currentChunk, analysis.keyTerms);
        const enhancedContent = this.formatChunkContent(currentChunk, title);
        chunks.push(this.createAdvancedChunk(enhancedContent, title, chunkIndex, fileName, fileType, analysis));
        
        currentChunk = fullSentence;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + fullSentence;
      }
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
      const title = this.generateIntelligentTitle(currentChunk, analysis.keyTerms);
      const enhancedContent = this.formatChunkContent(currentChunk, title);
      chunks.push(this.createAdvancedChunk(enhancedContent, title, chunkIndex, fileName, fileType, analysis));
    }
    
    return chunks;
  }

  // Basic fallback when enhanced methods fail
  private createBasicFallbackChunks(content: string, fileName: string, fileType: string): StudyChunk[] {
    const chunks: StudyChunk[] = [];
    const chunkSize = 800;
    const overlap = 100;
    
    for (let i = 0; i < content.length; i += chunkSize - overlap) {
      const chunkContent = content.substring(i, i + chunkSize);
      if (chunkContent.trim().length < 100) continue;
      
      const title = `Part ${Math.floor(i / (chunkSize - overlap)) + 1}`;
      const formattedContent = `## ${title}\n\n${chunkContent.trim()}`;
      
      chunks.push(this.createAdvancedChunk(formattedContent, title, chunks.length, fileName, fileType, {}));
    }
    
    return chunks;
  }

  private createParagraphBasedChunks(
    paragraphs: string[], 
    fileName: string, 
    fileType: string
  ): StudyChunk[] {
    const chunks: StudyChunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue;
      
      // If adding this paragraph would make the chunk too long, start a new chunk
      if (currentChunk.length + paragraph.length > 800 && currentChunk.length > 200) {
        chunks.push(this.createChunkFromContent(currentChunk, chunkIndex, fileName, fileType));
        currentChunk = paragraph;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    // Add the final chunk
    if (currentChunk.trim()) {
      chunks.push(this.createChunkFromContent(currentChunk, chunkIndex, fileName, fileType));
    }
    
    return chunks;
  }

  private createSentenceBasedChunks(
    sentences: string[], 
    fileName: string, 
    fileType: string
  ): StudyChunk[] {
    const chunks: StudyChunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const sentence of sentences) {
      if (!sentence.trim()) continue;
      
      const sentenceWithPeriod = sentence.trim() + '.';
      
      // If adding this sentence would make the chunk too long, start a new chunk
      if (currentChunk.length + sentenceWithPeriod.length > 600 && currentChunk.length > 150) {
        chunks.push(this.createChunkFromContent(currentChunk, chunkIndex, fileName, fileType));
        currentChunk = sentenceWithPeriod;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentenceWithPeriod;
      }
    }
    
    // Add the final chunk
    if (currentChunk.trim()) {
      chunks.push(this.createChunkFromContent(currentChunk, chunkIndex, fileName, fileType));
    }
    
    return chunks;
  }

  private adjustChunkSizes(chunks: StudyChunk[]): StudyChunk[] {
    const adjustedChunks: StudyChunk[] = [];
    
    for (const chunk of chunks) {
      const content = chunk.content[0]?.content || '';
      
      // If chunk is too small (less than 100 chars), try to merge with next
      if (content.length < 100 && adjustedChunks.length > 0) {
        const lastChunk = adjustedChunks[adjustedChunks.length - 1];
        const combinedContent = lastChunk.content[0].content + '\n\n' + content;
        
        // Only merge if the combined content isn't too long
        if (combinedContent.length <= 1000) {
          lastChunk.content[0].content = combinedContent;
          lastChunk.title = `${lastChunk.title} (Extended)`;
          lastChunk.estimatedTime += chunk.estimatedTime;
          continue;
        }
      }
      
      // If chunk is too large (more than 1200 chars), split it
      if (content.length > 1200) {
        const splitChunks = this.splitLargeChunk(chunk);
        adjustedChunks.push(...splitChunks);
      } else {
        adjustedChunks.push(chunk);
      }
    }
    
    return adjustedChunks;
  }

  private splitLargeChunk(chunk: StudyChunk): StudyChunk[] {
    const content = chunk.content[0]?.content || '';
    const sentences = content.split(/[.!?]+\s+/);
    const splitChunks: StudyChunk[] = [];
    
    let currentContent = '';
    let partIndex = 1;
    
    for (const sentence of sentences) {
      if (!sentence.trim()) continue;
      
      const sentenceWithPeriod = sentence.trim() + '.';
      
      if (currentContent.length + sentenceWithPeriod.length > 800 && currentContent.length > 200) {
        splitChunks.push(this.createChunkFromContent(
          currentContent, 
          splitChunks.length, 
          chunk.content[0].sourceFile, 
          chunk.content[0].type,
          `${chunk.title} (Part ${partIndex})`
        ));
        currentContent = sentenceWithPeriod;
        partIndex++;
      } else {
        currentContent += (currentContent ? ' ' : '') + sentenceWithPeriod;
      }
    }
    
    if (currentContent.trim()) {
      splitChunks.push(this.createChunkFromContent(
        currentContent, 
        splitChunks.length, 
        chunk.content[0].sourceFile, 
        chunk.content[0].type,
        `${chunk.title} (Part ${partIndex})`
      ));
    }
    
    return splitChunks;
  }

  private createChunkFromContent(
    content: string, 
    index: number, 
    fileName: string, 
    fileType: string,
    title?: string
  ): StudyChunk {
    // Extract potential keywords from content
    const keywords = this.extractKeywords(content);
    
    // Estimate reading time (average 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const estimatedTime = Math.max(5, Math.ceil(wordCount / 200 * 60)); // minutes
    
    // Determine difficulty based on content complexity
    const difficulty = this.estimateDifficulty(content);
    
    return {
      id: `chunk-${Date.now()}-${index}`,
      title: title || this.generateChunkTitle(content, index),
      content: [{
        id: `content-${index}`,
        type: fileType as any,
        title: title || this.generateChunkTitle(content, index),
        content: content.trim(),
        complexity: difficulty,
        estimatedTime,
        dependencies: [],
        keywords,
        sourceFile: fileName,
      }],
      estimatedTime,
      difficulty: this.mapComplexityToDifficulty(difficulty),
      prerequisites: [],
      learningObjectives: [],
      assessmentQuestions: [],
      keywords,
      order: index,
    };
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction based on word frequency and length
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isCommonWord(word));
    
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    return Object.entries(wordFreq)
      .filter(([word, freq]) => freq > 1 || word.length > 6)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
      'his', 'from', 'they', 'she', 'her', 'been', 'than', 'its', 'were', 'said',
      'each', 'which', 'their', 'time', 'will', 'about', 'there', 'when', 'them',
      'these', 'some', 'what', 'your', 'can', 'said', 'other', 'into', 'after',
      'also', 'could', 'our', 'first', 'way', 'where', 'much', 'then'
    ];
    return commonWords.includes(word);
  }

  private generateChunkTitle(content: string, index: number): string {
    // Try to extract a meaningful title from the first sentence or paragraph
    const firstSentence = content.split(/[.!?]/)[0]?.trim();
    
    if (firstSentence && firstSentence.length < 60 && firstSentence.length > 10) {
      return firstSentence;
    }
    
    // Extract key phrases
    const words = content.split(/\s+/).slice(0, 10);
    const cleanWords = words.filter(word => 
      word.length > 2 && 
      !this.isCommonWord(word.toLowerCase().replace(/[^\w]/g, ''))
    );
    
    if (cleanWords.length >= 2) {
      return cleanWords.slice(0, 4).join(' ').replace(/[^\w\s]/g, '');
    }
    
    return `Study Section ${index + 1}`;
  }

  private estimateDifficulty(content: string): number {
    let difficulty = 5; // Base difficulty
    
    // Check for technical terms or complex vocabulary
    const complexWords = content.match(/\b\w{8,}\b/g) || [];
    difficulty += Math.min(complexWords.length * 0.1, 2);
    
    // Check for mathematical or scientific notation
    if (/[\d]+\.[\d]+|[\w]+\([\w\s,]+\)|\b[A-Z]{2,}\b/.test(content)) {
      difficulty += 1;
    }
    
    // Check sentence complexity (long sentences are harder)
    const sentences = content.split(/[.!?]+/);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    if (avgSentenceLength > 20) difficulty += 1;
    if (avgSentenceLength > 30) difficulty += 1;
    
    return Math.min(Math.max(Math.round(difficulty), 1), 10);
  }

  private createPageBasedChunks(fileName: string, fileType: string): StudyChunk[] {
    console.log('Creating page-based chunks for:', fileName);
    
    // Estimate number of pages based on file type and name
    const estimatedPages = this.estimatePageCount(fileName, fileType);
    
    const chunks: StudyChunk[] = [];
    
    for (let i = 1; i <= estimatedPages; i++) {
      const chunk: StudyChunk = {
        id: `page-${i}`,
        title: `Page ${i}`,
        content: [{
          id: `content-${i}`,
          type: 'slide' as const,
          title: `Page ${i} Content`,
          content: `This is the content from page ${i} of ${fileName}. Study this page carefully and take notes on the key concepts presented.`,
          complexity: this.estimatePageComplexity(i, estimatedPages),
          estimatedTime: 15, // 15 minutes per page
          dependencies: i > 1 ? [`page-${i-1}`] : [],
          keywords: this.generatePageKeywords(fileName, i),
          sourceFile: fileName,
          pageNumber: i,
        }],
        estimatedTime: 15,
        difficulty: this.mapComplexityToDifficulty(this.estimatePageComplexity(i, estimatedPages)),
        prerequisites: i > 1 ? [`page-${i-1}`] : [],
        learningObjectives: [
          `Understand the key concepts presented on page ${i}`,
          `Apply the knowledge from page ${i} to solve related problems`,
          `Connect page ${i} content with previous pages`
        ],
        assessmentQuestions: [
          `What are the main concepts discussed on page ${i}?`,
          `How does the content on page ${i} relate to the overall topic?`,
          `Can you explain the key points from page ${i} in your own words?`
        ],
        keywords: this.generatePageKeywords(fileName, i),
        order: i,
      };
      
      chunks.push(chunk);
    }
    
    console.log(`Created ${chunks.length} page-based chunks`);
    return chunks;
  }

  private estimatePageCount(fileName: string, fileType: string): number {
    // Simple estimation based on file type and name
    switch (fileType) {
      case 'pdf':
        // Estimate 1-3 pages for CVs, 5-10 for documents, 10-20 for textbooks
        if (fileName.toLowerCase().includes('cv') || fileName.toLowerCase().includes('resume')) {
          return 2; // CVs are usually 1-2 pages
        }
        if (fileName.toLowerCase().includes('textbook') || fileName.toLowerCase().includes('book')) {
          return 15; // Textbooks have many pages
        }
        return 5; // Default for other PDFs
      case 'txt':
      case 'md':
        return 3; // Text files are usually shorter
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 1; // Images are single pages
      default:
        return 3; // Default fallback
    }
  }

  private estimatePageComplexity(pageNumber: number, totalPages: number): number {
    // First and last pages are usually easier (intro/conclusion)
    if (pageNumber === 1 || pageNumber === totalPages) {
      return 3; // Easy
    }
    // Middle pages are usually more complex
    if (pageNumber > totalPages * 0.3 && pageNumber < totalPages * 0.7) {
      return 7; // Hard
    }
    return 5; // Medium
  }

  private generatePageKeywords(fileName: string, pageNumber: number): string[] {
    const baseKeywords = fileName.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(word => word.length > 2);
    return [
      ...baseKeywords.slice(0, 3), // First 3 words from filename
      `page-${pageNumber}`,
      'study-material',
      'learning-content'
    ];
  }

  private extractBasicKeyConcepts(content: string): string[] {
    console.log('🔄 Using offline key concept extraction...');
    
    // Enhanced offline concept extraction
    const concepts: string[] = [];
    
    // Method 1: Extract capitalized words (likely proper nouns/important terms)
    const capitalizedWords = content.match(/\b[A-Z][a-z]{2,}\b/g) || [];
    concepts.push(...capitalizedWords.slice(0, 5));
    
    // Method 2: Extract frequent significant words
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const frequency: { [key: string]: number } = {};
    
    words.forEach(word => {
      if (!this.isCommonWord(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    
    // Get most frequent words
    const frequentWords = Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
    
    concepts.push(...frequentWords);
    
    // Method 3: Extract quoted terms
    const quotedTerms = content.match(/"([^"]{3,20})"/g) || [];
    const cleanQuoted = quotedTerms.map(term => term.replace(/"/g, ''));
    concepts.push(...cleanQuoted.slice(0, 3));
    
    // Method 4: Extract terms after common indicators
    const indicators = ['concept of', 'theory of', 'principle of', 'method of', 'process of'];
    indicators.forEach(indicator => {
      const regex = new RegExp(`${indicator}\\s+([a-zA-Z\\s]{3,20})`, 'gi');
      const matches = content.match(regex) || [];
      const terms = matches.map(match => 
        match.replace(new RegExp(indicator, 'i'), '').trim()
      );
      concepts.push(...terms.slice(0, 2));
    });
    
    // Remove duplicates and clean up
    const uniqueConcepts = [...new Set(concepts)]
      .filter(concept => concept && concept.length > 2 && concept.length < 30)
      .slice(0, 10);
    
    console.log(`✅ Extracted ${uniqueConcepts.length} offline concepts:`, uniqueConcepts.slice(0, 3));
    
    return uniqueConcepts.length > 0 ? uniqueConcepts : ['study material', 'content', 'information'];
  }

  private createPageBasedChunksFromContent(content: string, fileName: string, fileType: string): StudyChunk[] {
    console.log('Creating page-based chunks from manual content for:', fileName);
    
    // Split content into logical sections (paragraphs or sections)
    const sections = this.splitContentIntelligently(content);
    
    const chunks: StudyChunk[] = [];
    
    sections.forEach((section, index) => {
      const chunk: StudyChunk = {
        id: `section-${index + 1}`,
        title: `Section ${index + 1}`,
        content: [{
          id: `content-${index + 1}`,
          type: 'slide' as const,
          title: `Section ${index + 1} Content`,
          content: section,
          complexity: this.estimateContentComplexity(section),
          estimatedTime: this.estimateReadingTime(section),
          dependencies: index > 0 ? [`section-${index}`] : [],
          keywords: this.extractKeywordsFromText(section),
          sourceFile: fileName,
          pageNumber: index + 1,
        }],
        estimatedTime: this.estimateReadingTime(section),
        difficulty: this.mapComplexityToDifficulty(this.estimateContentComplexity(section)),
        prerequisites: index > 0 ? [`section-${index}`] : [],
        learningObjectives: [
          `Understand the key concepts in section ${index + 1}`,
          `Apply the knowledge from section ${index + 1}`,
          `Connect section ${index + 1} with previous sections`
        ],
        assessmentQuestions: [
          `What are the main points in section ${index + 1}?`,
          `How does section ${index + 1} relate to the overall topic?`,
          `Can you summarize section ${index + 1}?`
        ],
        keywords: this.extractKeywordsFromText(section),
        order: index + 1,
      };
      
      chunks.push(chunk);
    });
    
    console.log(`Created ${chunks.length} content-based chunks`);
    return chunks;
  }

  private splitContentIntelligently(content: string): string[] {
    // Split content by double line breaks (paragraphs) or by length
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    if (paragraphs.length <= 1) {
      // If no clear paragraphs, split by length (500 characters per section)
      const sections = [];
      let currentSection = '';
      const words = content.split(' ');
      
      for (const word of words) {
        if (currentSection.length + word.length > 500 && currentSection.length > 0) {
          sections.push(currentSection.trim());
          currentSection = word;
        } else {
          currentSection += (currentSection ? ' ' : '') + word;
        }
      }
      
      if (currentSection.trim()) {
        sections.push(currentSection.trim());
      }
      
      return sections;
    }
    
    return paragraphs;
  }

  private estimateContentComplexity(content: string): number {
    // Simple complexity estimation based on content length and word variety
    const words = content.split(/\s+/).length;
    const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;
    const complexity = Math.min(10, Math.max(1, Math.floor((uniqueWords / words) * 10)));
    return complexity;
  }

  private estimateReadingTime(content: string): number {
    // Estimate reading time: ~200 words per minute
    const words = content.split(/\s+/).length;
    return Math.max(5, Math.ceil(words / 200)); // Minimum 5 minutes
  }

  // Enhanced PDF content post-processing to improve structure and quality
  private postProcessPDFContent(rawContent: string): string {
    try {
      console.log('🔧 Post-processing PDF content for better structure...');
      
      let processedContent = rawContent;
      
      // Remove common PDF artifacts and noise
      processedContent = processedContent
        .replace(/\f/g, '\n\n') // Form feed to paragraph break
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // Remove control characters
        .replace(/\s*\n\s*\n\s*/g, '\n\n') // Normalize multiple line breaks
        .replace(/[ \t]+/g, ' ') // Normalize whitespace
        .trim();
      
      // Improve structure detection
      const lines = processedContent.split('\n');
      const structuredLines: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
          structuredLines.push('');
          continue;
        }
        
        // Detect and format headers (all caps, short lines, etc.)
        if (this.isLikelyHeader(line, i, lines)) {
          if (line.length < 60 && /^[A-Z\s\d\.\-:]+$/.test(line)) {
            structuredLines.push(`## ${line}`);
          } else {
            structuredLines.push(`### ${line}`);
          }
        }
        // Detect bullet points and lists
        else if (/^[\•\*\-\+]\s|^\d+[\.\)]\s|^[a-zA-Z][\.\)]\s/.test(line)) {
          structuredLines.push(`- ${line.replace(/^[\•\*\-\+]\s|^\d+[\.\)]\s|^[a-zA-Z][\.\)]\s/, '')}`);
        }
        // Regular content
        else {
          structuredLines.push(line);
        }
      }
      
      // Join and clean up the result
      const finalContent = structuredLines
        .join('\n')
        .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
        .trim();
      
      console.log('✅ PDF content post-processing complete');
      console.log(`📄 Original length: ${rawContent.length}, Processed length: ${finalContent.length}`);
      
      return finalContent;
    } catch (error) {
      console.error('Error post-processing PDF content:', error);
      return rawContent; // Return original if processing fails
    }
  }

  // Clean raw PDF text extracted via fallback methods
  private cleanRawPDFText(rawText: string): string {
    try {
      console.log('🧹 Cleaning raw PDF text...');
      
      let cleanedText = rawText;
      
      // Remove binary data indicators
      cleanedText = cleanedText
        .replace(/\x00+/g, ' ') // Replace null bytes
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Keep only printable ASCII + whitespace
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/(.)\1{10,}/g, '$1') // Remove excessive character repetition
        .trim();
      
      // Basic structure improvement
      const words = cleanedText.split(/\s+/);
      const meaningfulWords = words.filter(word => 
        word.length > 1 && 
        !/^[\d\W]+$/.test(word) && // Not just numbers/symbols
        word.toLowerCase() !== 'obj' && // Common PDF artifacts
        word.toLowerCase() !== 'endobj'
      );
      
      if (meaningfulWords.length < 10) {
        return `PDF text extraction was limited. Raw content available:

${cleanedText.substring(0, 500)}...

For better results, please copy the text content directly from your PDF and paste it in the manual content input field.`;
      }
      
      // Reconstruct with basic formatting
      const reconstructed = meaningfulWords
        .join(' ')
        .replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2') // Add paragraph breaks
        .replace(/(\d+\.)\s+([A-Z])/g, '\n$1 $2') // Format numbered lists
        .trim();
      
      console.log('✅ Raw PDF text cleaning complete');
      return reconstructed;
      
    } catch (error) {
      console.error('Error cleaning raw PDF text:', error);
      return rawText; // Return original if cleaning fails
    }
  }

  // Helper method to detect if a line is likely a header
  private isLikelyHeader(line: string, index: number, allLines: string[]): boolean {
    // Short lines in all caps
    if (line.length < 60 && /^[A-Z\s\d\.\-:]+$/.test(line)) {
      return true;
    }
    
    // Lines followed by blank line (common header pattern)
    if (index < allLines.length - 1 && !allLines[index + 1].trim()) {
      return line.length < 80 && !/[.!?]$/.test(line);
    }
    
    // Lines with title case and no ending punctuation
    if (!/[.!?]$/.test(line) && line.length < 80) {
      const words = line.split(/\s+/);
      const titleCaseWords = words.filter(word => 
        /^[A-Z][a-z]+/.test(word) || /^[A-Z]+$/.test(word)
      );
      return titleCaseWords.length >= words.length * 0.7;
    }
    
    return false;
  }

  // Post-process image analysis content for better formatting
  private postProcessImageContent(rawContent: string): string {
    try {
      console.log('🔧 Post-processing image analysis content...');
      
      let processedContent = rawContent;
      
      // Clean up common AI response artifacts
      processedContent = processedContent
        .replace(/^(Here's|Here is|I can see|The image shows|This image contains)/i, '')
        .replace(/\*\*([^*]+)\*\*/g, '**$1**') // Normalize bold formatting
        .replace(/^\s*[-*+]\s+/gm, '- ') // Normalize bullet points
        .trim();
      
      // Ensure proper markdown structure
      if (!processedContent.startsWith('#')) {
        processedContent = `# Image Content\n\n${processedContent}`;
      }
      
      // Add visual separators for better readability
      processedContent = processedContent
        .replace(/\n\n/g, '\n\n---\n\n')
        .replace(/---\n\n---/g, '---');
      
      console.log('✅ Image content post-processing complete');
      return processedContent;
      
    } catch (error) {
      console.error('Error post-processing image content:', error);
      return rawContent;
    }
  }

  // Enhanced text extraction from image base64
  private extractTextFromImageBase64(base64Content: string): string {
    try {
      console.log('🔧 Attempting enhanced text extraction from image...');
      
      // Method 1: Basic binary analysis with better text detection
      const binaryString = atob(base64Content);
      
      // Extract potential text patterns
      const textPatterns: string[] = [];
      
      // Look for common text encoding patterns
      for (let i = 0; i < binaryString.length - 10; i++) {
        const chunk = binaryString.substring(i, i + 100);
        const cleanChunk = chunk
          .replace(/[^\x20-\x7E]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanChunk.length > 20 && this.hasValidWords(cleanChunk)) {
          textPatterns.push(cleanChunk);
        }
      }
      
      // Combine and deduplicate found text
      const combinedText = [...new Set(textPatterns)]
        .filter(text => text.length > 10)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (combinedText.length > 50) {
        console.log('✅ Extracted text from image:', combinedText.length, 'characters');
        return combinedText;
      }
      
      // Method 2: Look for metadata text
      const metadataText = this.extractImageMetadataText(binaryString);
      if (metadataText.length > 20) {
        return metadataText;
      }
      
      return '';
      
    } catch (error) {
      console.error('Error extracting text from image:', error);
      return '';
    }
  }

  // Helper to check if text contains valid words
  private hasValidWords(text: string): boolean {
    const commonWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by|from|this|that|is|are|was|were|have|has|had|will|would|could|should)\b/i;
    const wordCount = text.split(/\s+/).filter(word => word.length > 2).length;
    return commonWords.test(text) && wordCount >= 3;
  }

  // Extract text from image metadata
  private extractImageMetadataText(binaryString: string): string {
    try {
      // Look for text in EXIF or other metadata sections
      const textIndicators = ['text', 'comment', 'description', 'title', 'subject'];
      let extractedText = '';
      
      for (const indicator of textIndicators) {
        const index = binaryString.toLowerCase().indexOf(indicator);
        if (index !== -1) {
          const metadataChunk = binaryString.substring(index, index + 500);
          const readableText = metadataChunk
            .replace(/[^\x20-\x7E]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (readableText.length > extractedText.length) {
            extractedText = readableText;
          }
        }
      }
      
      return extractedText;
    } catch (error) {
      return '';
    }
  }

  // Preprocess content for consistent AI analysis regardless of source
  private preprocessContentForAI(content: string, fileType: string): string {
    try {
      console.log('🔧 Preprocessing content for AI analysis...');
      
      let processedContent = content;
      
      // STEP 1: Basic content cleaning
      processedContent = processedContent
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n') // Handle old Mac line endings
        .replace(/\t/g, '    ') // Convert tabs to spaces
        .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
        .replace(/[\u2000-\u200B\u2028-\u2029]/g, ' ') // Replace various Unicode spaces
        .trim();
      
      // STEP 2: Normalize whitespace and line breaks
      processedContent = processedContent
        .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple line breaks to double
        .replace(/\n{4,}/g, '\n\n\n') // Limit excessive line breaks
        .trim();
      
      // STEP 3: File type specific preprocessing
      switch (fileType.toLowerCase()) {
        case 'pdf':
          processedContent = this.preprocessPDFContent(processedContent);
          break;
        case 'image':
          processedContent = this.preprocessImageContent(processedContent);
          break;
        case 'text':
        case 'md':
          processedContent = this.preprocessTextContent(processedContent);
          break;
        default:
          processedContent = this.preprocessGenericContent(processedContent);
      }
      
      // STEP 4: Ensure minimum content quality
      if (processedContent.length < 50) {
        console.warn('Content too short after preprocessing, adding context');
        processedContent = `# Study Content

${processedContent}

*Note: This content was automatically processed and may require manual review for optimal study experience.*`;
      }
      
      // STEP 5: Add structure hints for AI if content lacks clear organization
      if (!this.hasGoodStructure(processedContent)) {
        processedContent = this.addStructureHints(processedContent);
      }
      
      console.log('✅ Content preprocessing complete');
      console.log(`📊 Length change: ${content.length} → ${processedContent.length}`);
      
      return processedContent;
      
    } catch (error) {
      console.error('Error preprocessing content:', error);
      return content; // Return original if preprocessing fails
    }
  }

  // PDF-specific content preprocessing
  private preprocessPDFContent(content: string): string {
    return content
      .replace(/\f/g, '\n\n') // Form feeds to paragraphs
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Fix concatenated words
      .replace(/(\d+)([A-Za-z])/g, '$1 $2') // Separate numbers from text
      .replace(/([a-z])(\d+)/g, '$1 $2') // Separate text from numbers
      .replace(/\.\s*\n\s*([a-z])/g, '. $1') // Fix sentence breaks
      .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2'); // Paragraph breaks
  }

  // Image analysis content preprocessing
  private preprocessImageContent(content: string): string {
    return content
      .replace(/^(I can see|The image shows|This image contains)/i, '') // Remove AI preambles
      .replace(/\*\*\*+/g, '**') // Normalize emphasis
      .replace(/^[\s-]*$/gm, '') // Remove empty lines with just dashes
      .replace(/\n{3,}/g, '\n\n') // Limit line breaks
      .trim();
  }

  // Text/markdown content preprocessing
  private preprocessTextContent(content: string): string {
    return content
      .replace(/^#+\s*/gm, match => match) // Preserve markdown headers
      .replace(/^\s*[-*+]\s+/gm, '- ') // Normalize bullet points
      .replace(/^\s*\d+\.\s+/gm, match => match) // Preserve numbered lists
      .replace(/`{3,}/g, '```') // Normalize code blocks
      .replace(/\*{3,}/g, '**') // Normalize emphasis
      .trim();
  }

  // Generic content preprocessing
  private preprocessGenericContent(content: string): string {
    return content
      .replace(/([.!?])\s*\n\s*([A-Z])/g, '$1\n\n$2') // Add paragraph breaks
      .replace(/(\w)\n(\w)/g, '$1 $2') // Join broken words
      .replace(/\s+([.!?])/g, '$1') // Fix spaced punctuation
      .trim();
  }

  // Check if content has good structure for AI processing
  private hasGoodStructure(content: string): boolean {
    const hasHeaders = /^#+\s+/m.test(content) || /^[A-Z\s]{10,50}$/m.test(content);
    const hasParagraphs = content.split('\n\n').length >= 2;
    const hasLists = /^\s*[-*+]\s+/m.test(content) || /^\s*\d+\.\s+/m.test(content);
    
    return hasHeaders || hasParagraphs || hasLists;
  }

  // Add structure hints to help AI process unstructured content
  private addStructureHints(content: string): string {
    console.log('📝 Adding structure hints for better AI processing...');
    
    // Split content into logical sections
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    
    if (paragraphs.length <= 1) {
      // Single paragraph - try to split by sentences
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      if (sentences.length > 1) {
        return sentences.map((sentence, index) => {
          const trimmed = sentence.trim();
          if (index === 0) return `# Main Topic\n\n${trimmed}.`;
          return `## Key Point ${index}\n\n${trimmed}.`;
        }).join('\n\n');
      }
    }
    
    // Multiple paragraphs - add section headers
    return paragraphs.map((paragraph, index) => {
      if (index === 0) return `# Main Content\n\n${paragraph}`;
      return `## Section ${index}\n\n${paragraph}`;
    }).join('\n\n');
  }

  // Clean markdown content while preserving structure
  private cleanMarkdownContent(content: string): string {
    try {
      console.log('🧹 Cleaning markdown content...');
      
      let cleaned = content;
      
      // Normalize markdown formatting
      cleaned = cleaned
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n') // Handle old Mac line endings
        .replace(/^\s*#+ */gm, match => match.trim() + ' ') // Normalize headers
        .replace(/^\s*[-*+] +/gm, '- ') // Normalize bullet points  
        .replace(/^\s*\d+\. +/gm, match => match.trim() + ' ') // Normalize numbered lists
        .replace(/`{4,}/g, '```') // Normalize code blocks
        .replace(/\*{4,}/g, '**') // Normalize emphasis
        .replace(/_{4,}/g, '__') // Normalize underline emphasis
        .trim();
      
      // Improve structure for better AI processing
      cleaned = cleaned
        .replace(/\n{4,}/g, '\n\n\n') // Limit excessive line breaks
        .replace(/^(#{1,6})\s*$/gm, '') // Remove empty headers
        .replace(/^\s*[-*+]\s*$/gm, '') // Remove empty bullet points
        .replace(/^\s*\d+\.\s*$/gm, '') // Remove empty numbered items
        .trim();
      
      console.log('✅ Markdown content cleaned');
      return cleaned;
      
    } catch (error) {
      console.error('Error cleaning markdown content:', error);
      return content;
    }
  }

  // Extract text content from HTML while preserving some structure
  private extractTextFromHTML(htmlContent: string): string {
    try {
      console.log('🏷️ Extracting text from HTML...');
      
      let textContent = htmlContent;
      
      // Remove script and style tags completely
      textContent = textContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
      
      // Convert common HTML elements to markdown-like formatting
      textContent = textContent
        .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n## $1\n\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n\n$1\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<ul[^>]*>(.*?)<\/ul>/gis, '\n$1\n')
        .replace(/<ol[^>]*>(.*?)<\/ol>/gis, '\n$1\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '\n```\n$1\n```\n');
      
      // Remove remaining HTML tags
      textContent = textContent.replace(/<[^>]*>/g, '');
      
      // Clean up whitespace and decode HTML entities
      textContent = textContent
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();
      
      // Add a header if none exists
      if (!textContent.match(/^##?\s+/m)) {
        textContent = `# Web Content\n\n${textContent}`;
      }
      
      console.log('✅ HTML text extraction complete');
      return textContent;
      
    } catch (error) {
      console.error('Error extracting text from HTML:', error);
      return htmlContent; // Return original if extraction fails
    }
  }

  // Helper methods for enhanced fallback chunking
  private isInstructionResponse(content: string): boolean {
    const instructionIndicators = [
      'please provide me with',
      'please provide the',
      'please copy and paste',
      'please upload',
      'i need you to',
      'i can help you',
      'i\'m ready to',
      'waiting for you to provide',
      'send me the content',
      'share the content',
      'provide the text',
      'paste the content here'
    ];
    
    // Detect non-educational content responses
    const nonEducationalIndicators = [
      'no_educational_content_detected',
      'does not appear to contain any educational content',
      'no visible text, charts, or other educational elements',
      'this image shows',
      'there are no educational',
      'no educational content',
      'not educational',
      'no diagrams',
      'no charts visible',
      'no text visible',
      'cannot identify educational content',
      'image does not contain',
      'no study material found'
    ];
    
    const lowercaseContent = content.toLowerCase();
    
    // Check for instruction indicators
    const hasInstructionIndicators = instructionIndicators.some(indicator => 
      lowercaseContent.includes(indicator)
    );
    
    // Check for non-educational content indicators
    const hasNonEducationalIndicators = nonEducationalIndicators.some(indicator => 
      lowercaseContent.includes(indicator)
    );
    
    return hasInstructionIndicators || hasNonEducationalIndicators;
  }

  private extractTopicHints(content: string): string[] {
    const topics: string[] = [];
    
    // Extract from headers
    const headers = content.match(/^#+\s+(.+)$/gm) || [];
    topics.push(...headers.map(h => h.replace(/^#+\s+/, '')));
    
    // Extract from bold/emphasized text
    const emphasized = content.match(/\*\*([^*]+)\*\*/g) || [];
    topics.push(...emphasized.map(e => e.replace(/\*\*/g, '')));
    
    // Extract from first sentences of paragraphs
    const firstSentences = content.split('\n\n').map(p => {
      const sentence = p.split(/[.!?]/)[0];
      return sentence.length > 10 && sentence.length < 100 ? sentence : null;
    }).filter(Boolean);
    
    topics.push(...firstSentences);
    
    return topics.slice(0, 10); // Limit to prevent overflow
  }

  private extractKeyTermsOffline(content: string): string[] {
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const frequency: { [key: string]: number } = {};
    
    // Count word frequency
    words.forEach(word => {
      if (!this.isCommonWord(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    
    // Return most frequent terms
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([word]) => word);
  }

  private formatSectionContent(section: string, title: string, headerLevel: number): string {
    const marker = '#'.repeat(Math.min(headerLevel, 3));
    let cleanSection = section.replace(/^#+\s+.+$/m, '').trim();
    
    // Enhanced markdown formatting
    return `${marker} ${title}

## Overview

${this.extractMainConcept(cleanSection)}

## Key Information

${this.formatContentWithStructure(cleanSection)}

## Summary

${this.generateSummary(cleanSection)}

---

*Study tip: Take notes on the key concepts above and try to explain them in your own words.*`;
  }

  private extractMainConcept(content: string): string {
    const firstParagraph = content.split('\n\n')[0];
    if (firstParagraph && firstParagraph.length > 50) {
      return firstParagraph.trim();
    }
    
    const firstSentences = content.split(/[.!?]/).slice(0, 2).join('.').trim();
    return firstSentences.length > 20 ? firstSentences + '.' : content.substring(0, 200) + '...';
  }

  private formatContentWithStructure(content: string): string {
    let formatted = content;
    
    // Format lists properly
    formatted = formatted.replace(/^[-*+•]\s+(.+)$/gm, '- **$1**');
    formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '$1. **$2**');
    
    // Format important terms
    formatted = formatted.replace(/\b([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*)\b/g, (match) => {
      if (match.length > 3 && match.length < 30 && /^[A-Z]/.test(match)) {
        return `**${match}**`;
      }
      return match;
    });
    
    // Add line breaks for better readability
    formatted = formatted.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');
    
    return formatted;
  }

  private generateSummary(content: string): string {
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 20);
    if (sentences.length === 0) return 'Review the content above to reinforce your understanding.';
    
    const lastSentence = sentences[sentences.length - 1].trim();
    const firstSentence = sentences[0].trim();
    
    if (sentences.length === 1) {
      return `This section covers: ${firstSentence}.`;
    }
    
    return `This section covers the concepts from "${firstSentence}" to "${lastSentence}". Make sure you understand these core ideas before moving on.`;
  }

  private extractListSections(content: string): Array<{title: string, content: string}> {
    const sections: Array<{title: string, content: string}> = [];
    const lines = content.split('\n');
    
    let currentSection = '';
    let currentTitle = 'List Items';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/^\s*[-*+•]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
        currentSection += line + '\n';
      } else if (line.trim() && currentSection) {
        // End of list section
        if (currentSection.length > 100) {
          sections.push({ title: currentTitle, content: currentSection.trim() });
        }
        currentSection = '';
        currentTitle = line.length < 60 ? line.trim() : 'Content Section';
      }
    }
    
    // Add final section
    if (currentSection.length > 100) {
      sections.push({ title: currentTitle, content: currentSection.trim() });
    }
    
    return sections;
  }

  private formatListContent(section: {title: string, content: string}): string {
    const formattedContent = section.content
      .replace(/^[-*+•]\s+(.+)$/gm, '- **$1**')
      .replace(/^(\d+)\.\s+(.+)$/gm, '$1. **$2**');
    
    return `## ${section.title}

### Key Points

${formattedContent}

### What This Means

Each point above represents an important concept. Take time to understand how these ideas connect to each other and to the broader topic.

---

*Review tip: Try to explain each point in your own words to test your understanding.*`;
  }

  private isTopicBoundary(currentChunk: string, nextParagraph: string): boolean {
    // Check if next paragraph starts with a potential topic indicator
    const topicIndicators = /^(However|Therefore|In contrast|Furthermore|Additionally|Moreover|Finally)/i;
    return topicIndicators.test(nextParagraph);
  }

  private generateIntelligentTitle(content: string, keyTerms: string[]): string {
    // Extract the main topic from first sentence
    const firstSentence = content.split(/[.!?]/)[0];
    
    if (firstSentence.length > 10 && firstSentence.length < 60) {
      // Add appropriate emoji based on content type
      const emoji = this.selectTitleEmoji(firstSentence, keyTerms);
      return `${emoji} ${firstSentence.trim()}`;
    }
    
    // Use key terms if available
    if (keyTerms.length > 0) {
      const relevantTerms = keyTerms.filter(term => 
        content.toLowerCase().includes(term.toLowerCase())
      ).slice(0, 2);
      
      if (relevantTerms.length > 0) {
        const emoji = this.selectTitleEmoji(content, keyTerms);
        return `${emoji} ${relevantTerms.join(' & ')}`;
      }
    }
    
    // Fallback to generic title with emoji
    return '✨ Study Section';
  }

  private selectTitleEmoji(content: string, keyTerms: string[]): string {
    const contentLower = content.toLowerCase();
    const allTerms = keyTerms.join(' ').toLowerCase();
    
    // Tech/Programming
    if (contentLower.includes('code') || contentLower.includes('programming') || contentLower.includes('algorithm')) {
      return '💻';
    }
    // Math/Science
    if (contentLower.includes('math') || contentLower.includes('equation') || contentLower.includes('formula')) {
      return '📊';
    }
    // Concepts/Theory
    if (contentLower.includes('concept') || contentLower.includes('theory') || contentLower.includes('principle')) {
      return '🧠';
    }
    // Practical/Application
    if (contentLower.includes('practice') || contentLower.includes('example') || contentLower.includes('application')) {
      return '🚀';
    }
    // Process/Method
    if (contentLower.includes('method') || contentLower.includes('process') || contentLower.includes('step')) {
      return '⚡';
    }
    // Strategy/Planning
    if (contentLower.includes('strategy') || contentLower.includes('plan') || contentLower.includes('approach')) {
      return '🎯';
    }
    // Tools/Resources
    if (contentLower.includes('tool') || contentLower.includes('resource') || contentLower.includes('system')) {
      return '🛠️';
    }
    // Innovation/Ideas
    if (contentLower.includes('innovation') || contentLower.includes('idea') || contentLower.includes('creative')) {
      return '💡';
    }
    
    // Default
    return '✨';
  }

  private generateModernTitle(content: string, index: number): string {
    const firstSentence = content.split(/[.!?]/)[0].trim();
    
    if (firstSentence.length > 10 && firstSentence.length < 50) {
      const emoji = this.selectTitleEmoji(content, []);
      return `${emoji} ${firstSentence}`;
    }
    
    // Extract key words for title
    const words = content.split(/\s+/).slice(0, 8);
    const meaningfulWords = words.filter(word => 
      word.length > 3 && !this.isCommonWord(word.toLowerCase())
    );
    
    if (meaningfulWords.length >= 2) {
      const emoji = this.selectTitleEmoji(content, meaningfulWords);
      return `${emoji} ${meaningfulWords.slice(0, 3).join(' ')}`;
    }
    
    const emojis = ['🎯', '🚀', '💡', '⚡', '🧠', '✨'];
    return `${emojis[index % emojis.length]} Study Section ${index + 1}`;
  }

  private formatModernChunkContent(content: string, title: string): string {
    const cleanContent = content.trim();
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keyPoint = sentences[0]?.trim() || 'Key insight from this section';
    
    return `# ${title}

## 🧠 Core Concept

> **Essential Understanding**: ${keyPoint}.

## 💡 Deep Dive

${cleanContent}

## 🔗 Key Takeaway

**Main Point**: Focus on understanding and applying the core concepts presented.

---

💭 **Reflect**: How does this connect to what you already know?`;
  }

  private formatChunkContent(content: string, title: string): string {
    // Extract key concepts from the content
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keyPoints = sentences.slice(0, 3).map(s => s.trim());
    
    // Create engaging introduction
    const introductions = [
      "Hey there! Let's dive into this fascinating topic together...",
      "Ready to explore something really interesting? Let's break this down...",
      "Here's something that's going to make a lot of sense once we walk through it...",
      "Let me share what makes this concept so important and practical..."
    ];
    const randomIntro = introductions[Math.floor(Math.random() * introductions.length)];
    
    return `# 🎯 ${title}

*${randomIntro}*

## 🧠 What You Need to Know

Think of this concept as a building block for understanding bigger ideas. Here's what makes it so important:

${keyPoints.map((point, i) => `- **Key Insight ${i + 1}**: ${point}. This matters because it helps you understand how different pieces fit together.`).join('\n')}

## 💡 Let's Go Deeper

> **Here's the thing**: Understanding this concept will give you a solid foundation for more advanced topics.

Now, let's explore this more thoroughly. Imagine you're trying to explain this to a friend who's curious but doesn't have much background knowledge:

${content.trim()}

**Real-World Connection**: This concept shows up in many practical situations. Whether you're problem-solving at work, making decisions in daily life, or building on this knowledge for future learning, these principles are incredibly useful.

**Common Questions**: You might be wondering how this connects to what you already know. That's exactly the right mindset! Learning builds on itself, and this piece fits into the larger puzzle.

## � Key Insights to Remember

1. **The Big Picture**: ${keyPoints[0] || 'This concept provides essential understanding for the broader topic'}.
2. **Practical Application**: You can use this knowledge to better understand related concepts and solve real problems.
3. **Building Forward**: This foundation prepares you for more advanced topics and deeper exploration.
4. **Why It Matters**: Understanding this helps you think more clearly about the subject and apply your knowledge effectively.

---

💭 **Food for Thought**: How does this connect to something you already know or have experienced?

✨ **Pro Tip**: Try explaining this concept in your own words - that's one of the best ways to make sure you really understand it!`;
  }

  private createAdvancedChunk(content: string, title: string, index: number, fileName: string, fileType: string, analysis: any): StudyChunk {
    const estimatedTime = Math.max(5, Math.min(25, Math.round(content.length / 150)));
    const complexity = analysis.complexity || this.estimateComplexity(content);
    
    return {
      id: `chunk-${Date.now()}-${index}`,
      title: title,
      content: [{
        id: `content-${index}`,
        type: fileType as any,
        title: title,
        content: content,
        complexity: complexity,
        estimatedTime: estimatedTime,
        dependencies: [],
        keywords: analysis.keyTerms?.slice(0, 5) || [],
        sourceFile: fileName,
      }],
      estimatedTime: estimatedTime,
      difficulty: this.mapComplexityToDifficulty(complexity),
      prerequisites: [],
      learningObjectives: this.generateOfflineLearningObjectives(content),
      assessmentQuestions: this.generateOfflineAssessmentQuestions(content),
      keywords: analysis.keyTerms?.slice(0, 8) || [],
      order: index,
    };
  }

  private enhanceChunkQuality(chunks: StudyChunk[], analysis: any): StudyChunk[] {
    return chunks.map(chunk => {
      // Add learning objectives if missing
      if (chunk.learningObjectives.length === 0) {
        chunk.learningObjectives = this.generateOfflineLearningObjectives(chunk.content[0]?.content || '');
      }
      
      // Add assessment questions if missing
      if (chunk.assessmentQuestions.length === 0) {
        chunk.assessmentQuestions = this.generateOfflineAssessmentQuestions(chunk.content[0]?.content || '');
      }
      
      // Ensure keywords are present
      if (chunk.keywords.length === 0) {
        chunk.keywords = this.extractKeywordsFromText(chunk.content[0]?.content || '');
      }
      
      return chunk;
    });
  }

  private ensureChunkQuality(chunks: StudyChunk[], fileName: string): StudyChunk[] {
    // Filter out very small chunks
    const qualityChunks = chunks.filter(chunk => {
      const content = chunk.content[0]?.content || '';
      return content.length >= 100;
    });
    
    // Ensure we have at least one chunk
    if (qualityChunks.length === 0) {
      return [{
        id: `chunk-fallback-${Date.now()}`,
        title: `Study Content from ${fileName}`,
        content: [{
          id: 'content-fallback',
          type: 'text' as any,
          title: `Content from ${fileName}`,
          content: '# Study Material\n\nContent was successfully uploaded but requires manual processing for optimal study experience.',
          complexity: 5,
          estimatedTime: 10,
          dependencies: [],
          keywords: [],
          sourceFile: fileName,
        }],
        estimatedTime: 10,
        difficulty: 'medium' as const,
        prerequisites: [],
        learningObjectives: ['Review uploaded content', 'Identify key concepts'],
        assessmentQuestions: ['What are the main topics covered?', 'How does this relate to previous learning?'],
        keywords: [],
        order: 0,
      }];
    }
    
    return qualityChunks;
  }

  private generateOfflineLearningObjectives(content: string): string[] {
    const objectives: string[] = [];
    
    // Extract key concepts
    const concepts = this.extractKeyTermsOffline(content).slice(0, 3);
    
    if (concepts.length > 0) {
      objectives.push(`🎯 Understand ${concepts[0]} and why it's important in real-world applications`);
      if (concepts.length > 1) {
        objectives.push(`🧠 Explore the connection between ${concepts[0]} and ${concepts[1]} with practical examples`);
      }
      if (concepts.length > 2) {
        objectives.push(`🚀 Apply your knowledge of ${concepts[2]} to solve problems and think critically`);
      }
    } else {
      objectives.push('✨ Grasp the core concepts and understand why they matter');
      objectives.push('⚡ Connect new ideas to things you already know');
      objectives.push('💡 Build practical understanding you can actually use');
    }
    
    return objectives.slice(0, 3);
  }

  private generateOfflineAssessmentQuestions(content: string): string[] {
    const questions: string[] = [];
    const keyTerms = this.extractKeyTermsOffline(content).slice(0, 2);
    
    if (keyTerms.length > 0) {
      questions.push(`💭 Can you think of a real-world example where ${keyTerms[0]} would be important or useful?`);
      if (keyTerms.length > 1) {
        questions.push(`🤔 How would you explain the relationship between ${keyTerms[0]} and ${keyTerms[1]} to someone who's new to this topic?`);
      }
    }
    
    questions.push('🧠 What was the most interesting or surprising thing you learned from this section?');
    
    // Add engaging follow-up questions
    const followUpQuestions = [
      '🚀 How might you use this knowledge in your daily life or future goals?',
      '⚡ What questions does this content raise for you about the broader topic?',
      '💡 Can you connect this to something you already know from another subject or experience?',
      '🎯 If you had to teach this to a friend, what would be the most important points to emphasize?'
    ];
    
    // Add one more question if we need it
    if (questions.length < 3) {
      const randomQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
      questions.push(randomQuestion);
    }
    
    return questions.slice(0, 3);
  }

  // Comprehensive content quality validation
  private validateContentQuality(content: string): { isValid: boolean; reason: string; helpfulMessage: string } {
    console.log('🔍 Running content quality validation...');
    
    // Check minimum length
    if (content.length < 50) {
      return {
        isValid: false,
        reason: 'Content too short',
        helpfulMessage: 'The uploaded file appears to be empty or too short. Please ensure your file contains substantial text content, or use manual content input.'
      };
    }

    // Check for readable character ratio
    const readableChars = content.match(/[a-zA-Z0-9\s.,!?;:()\-]/g)?.length || 0;
    const readableRatio = readableChars / content.length;
    
    console.log(`📊 Readable ratio: ${(readableRatio * 100).toFixed(1)}% (${readableChars}/${content.length})`);
    
    if (readableRatio < 0.6) {
      return {
        isValid: false,
        reason: `Low readable character ratio: ${(readableRatio * 100).toFixed(1)}%`,
        helpfulMessage: `# Content Processing Issue

The uploaded file contains mostly unreadable characters (${(readableRatio * 100).toFixed(1)}% readable).

**This usually happens with:**
- Binary/encoded files
- Corrupted documents  
- Scanned images without text layer
- Password-protected files

**Solution:** Please use manual content input:
1. Open your file in its native application
2. Copy the text content (Ctrl+A, Ctrl+C)
3. Use "Add Content Manually" option
4. Paste your content for processing

*Manual input ensures 100% accuracy and proper formatting.*`
      };
    }

    // Check for garbage patterns
    const garbagePatterns = [
      {
        pattern: /^[\s\W]{10,}$/,
        description: 'mostly symbols and whitespace'
      },
      {
        pattern: /[^\x20-\x7E\n\r\t]{20,}/,
        description: 'long sequences of non-printable characters'
      },
      {
        pattern: /^[0-9\s\W]{50,}$/,
        description: 'mostly numbers and symbols without readable text'
      },
      {
        pattern: /(\w)\1{10,}/g,
        description: 'repeated character sequences'
      }
    ];

    for (const garbage of garbagePatterns) {
      if (garbage.pattern.test(content)) {
        return {
          isValid: false,
          reason: `Detected garbage pattern: ${garbage.description}`,
          helpfulMessage: `# File Processing Error

The uploaded file contains ${garbage.description}, which suggests it may be corrupted or in an unsupported format.

**Recommended actions:**
1. **Verify file integrity** - Try opening the file in its original application
2. **Check file format** - Ensure it's a supported document type
3. **Use manual input** - Copy text content directly from the source
4. **Re-export file** - Save as a new PDF or text file from the original application

**For best results:** Use the "Add Content Manually" option with copy-pasted text.`
        };
      }
    }

    // Check for common PDF extraction artifacts
    const pdfArtifacts = [
      /\/\w+\s+\d+\s+R/g,  // PDF object references like "/PDF 1 R"
      /stream\s+.*?endstream/g,  // PDF stream markers
      /BT\s+.*?ET/g,  // PDF text object markers
      /^\d+\s+\d+\s+obj/m  // PDF object definitions
    ];

    const artifactMatches = pdfArtifacts.reduce((count, pattern) => {
      return count + (content.match(pattern)?.length || 0);
    }, 0);

    if (artifactMatches > 10) {
      return {
        isValid: false,
        reason: `High PDF artifact count: ${artifactMatches} patterns detected`,
        helpfulMessage: `# PDF Structure Detected

The content appears to contain PDF internal structure rather than readable text.

**This happens when:**
- PDF text extraction returns metadata instead of content
- The PDF contains complex formatting or is image-based
- The document has security restrictions

**Quick fix:**
1. **Open the PDF** in any PDF reader (Adobe, Chrome, etc.)
2. **Select all text** (Ctrl+A or Cmd+A)  
3. **Copy** (Ctrl+C or Cmd+C)
4. **Return here** and use "Add Content Manually"
5. **Paste** the copied text

*This method extracts the actual readable content instead of PDF metadata.*`
      };
    }

    // Check for meaningful word content
    const words = content.match(/\b[a-zA-Z]{2,}\b/g) || [];
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    
    if (words.length < 10 || uniqueWords.size < 5) {
      return {
        isValid: false,
        reason: `Insufficient meaningful content: ${words.length} words, ${uniqueWords.size} unique`,
        helpfulMessage: `# Insufficient Content Detected

The file contains very few meaningful words (${words.length} total, ${uniqueWords.size} unique).

**This might indicate:**
- The file is mostly images or diagrams
- Text extraction failed to capture readable content
- The document is in an unsupported format

**To proceed:**
1. **Manual input** is recommended for best results
2. **Copy text directly** from your original document
3. **Use "Add Content Manually"** option in the app

*This ensures you get meaningful study material instead of fragmented text.*`
      };
    }

    console.log('✅ Content passed all validation checks');
    return {
      isValid: true,
      reason: 'Content validation passed',
      helpfulMessage: ''
    };
  }

  // Validate that extracted content is relevant to the uploaded file
  private async validateContentRelevance(extractedContent: string, filePath: string): Promise<boolean> {
    try {
      // Extract filename from path for context
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';
      
      // Quick validation - check if content seems educational and substantial
      if (extractedContent.length < 100) {
        console.log('⚠️ Content too short, may not be valid extraction');
        return false;
      }
      
      // Check for common hallucination patterns
      const hallucinations = [
        'please provide',
        'i cannot',
        'as an ai',
        'i need you to',
        'sorry, i can\'t',
        'i don\'t have access'
      ];
      
      const lowerContent = extractedContent.toLowerCase();
      const hasHallucinations = hallucinations.some(phrase => lowerContent.includes(phrase));
      
      if (hasHallucinations) {
        console.log('⚠️ Content contains AI response patterns, not actual file content');
        return false;
      }
      
      // Check for educational content indicators
      const educationalIndicators = [
        '#', '##', '###', // Headers
        'definition', 'introduction', 'conclusion', 'summary',
        'chapter', 'section', 'lesson', 'topic',
        'learning', 'study', 'understand', 'concept',
        'example', 'practice', 'exercise', 'question'
      ];
      
      const hasEducationalContent = educationalIndicators.some(indicator => 
        lowerContent.includes(indicator)
      );
      
      console.log(`📊 Content validation - Educational indicators: ${hasEducationalContent}, No hallucinations: ${!hasHallucinations}`);
      
      return hasEducationalContent && !hasHallucinations;
      
    } catch (error) {
      console.log('⚠️ Content validation failed:', error.message);
      return true; // Default to true if validation fails
    }
  }
}

// Singleton instance
export const contentProcessor = new ContentProcessor();

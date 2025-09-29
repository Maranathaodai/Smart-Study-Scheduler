import * as FileSystem from 'expo-file-system';
import { openRouterClient } from './openrouter';
import { CONFIG } from './config';

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

  async processFile(filePath: string, fileName: string): Promise<ContentProcessingResult> {
    const startTime = Date.now();
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    try {
      // Extract content from file
      let rawContent: string;
      let fileType: string;

      switch (fileExtension) {
        case 'pdf':
          rawContent = await this.extractPDFContent(filePath);
          fileType = 'pdf';
          break;
        case 'txt':
        case 'md':
          rawContent = await this.extractTextContent(filePath);
          fileType = 'text';
          break;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          rawContent = await this.extractImageContent(filePath);
          fileType = 'image';
          break;
        default:
          rawContent = `Sample content from ${fileName}. This is a placeholder for the actual file content that would be extracted and processed by AI.`;
          fileType = 'text';
      }

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
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  async processFileContent(content: string, fileName: string, fileType: string): Promise<ContentProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log('Processing manual content for:', fileName);
      
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
      console.log('Extracting PDF content from:', filePath);
      
      // Import expo-file-system legacy API for file operations
      const FileSystem = require('expo-file-system/legacy');
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      console.log('File exists, size:', fileInfo.size, 'bytes');
      
      // Read the file as base64 for AI processing
      const base64Content = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('PDF file read successfully, base64 length:', base64Content.length);
      
      // Use AI to extract text from PDF
      try {
        console.log('Using AI to extract text from PDF...');
        const extractedText = await this.openRouterClient.extractTextFromPDF(base64Content);
        
        if (extractedText && extractedText.trim().length > 50) {
          console.log('Successfully extracted text from PDF using AI, length:', extractedText.length);
          return extractedText.trim();
        }
      } catch (aiError) {
        console.log('AI PDF extraction failed:', aiError.message);
      }
      
      // Fallback: Try to read as text (some PDFs might have extractable text)
      try {
        const textContent = await FileSystem.readAsStringAsync(filePath, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        if (textContent && textContent.length > 100 && !textContent.includes('\x00')) {
          console.log('Successfully extracted text content from PDF');
          return textContent;
        }
      } catch (textError) {
        console.log('Could not read PDF as text');
      }
      
      // If all methods fail, return a helpful message
      return `PDF file uploaded successfully (${fileInfo.size} bytes). 

The PDF content could not be automatically extracted. Please copy the text content from your PDF and paste it in the manual content input field for the best study experience.`;
      
    } catch (error) {
      console.error('Error extracting PDF content:', error);
      throw new Error(`Failed to extract PDF content: ${error.message}`);
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

  private async extractImageContent(filePath: string): Promise<string> {
    try {
      console.log('Extracting image content from:', filePath);
      
      // Import expo-file-system legacy API for file operations
      const FileSystem = require('expo-file-system/legacy');
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      console.log('Image file exists, size:', fileInfo.size, 'bytes');
      
      // Read the image as base64
      const base64Content = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('Image file read successfully, base64 length:', base64Content.length);
      
      // Use AI to analyze the image content
      try {
        console.log('Using AI to analyze image content...');
        const imageAnalysis = await this.openRouterClient.analyzeImageContent(base64Content);
        
        if (imageAnalysis && imageAnalysis.trim().length > 50) {
          console.log('Successfully analyzed image content using AI, length:', imageAnalysis.length);
          return imageAnalysis.trim();
        }
      } catch (aiError) {
        console.log('AI image analysis failed:', aiError.message);
      }
      
      // Fallback: Try basic text extraction
      try {
        console.log('Attempting basic image text extraction...');
        
        const binaryString = atob(base64Content);
        const readableText = binaryString
          .replace(/[^\x20-\x7E]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        const hasRealWords = /(?:^|\s)(?:the|and|or|but|in|on|at|to|for|of|with|by|from|up|about|into|through|during|before|after|above|below|between|among|throughout|despite|towards|upon|concerning|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|must|can|shall|this|that|these|those|i|you|he|she|it|we|they|me|him|her|us|them|my|your|his|her|its|our|their|mine|yours|hers|ours|theirs)(?:\s|$)/i.test(readableText);
        
        if (readableText.length > 100 && hasRealWords && !/JFIF|EXIF|PNG|GIF|BMP|TIFF|JPEG|JPG/i.test(readableText)) {
          console.log('Successfully extracted readable text from image, length:', readableText.length);
          return readableText;
        }
      } catch (imageError) {
        console.log('Image text extraction failed:', imageError.message);
      }
      
      // If all methods fail, return a helpful message
      return `Image file uploaded successfully (${fileInfo.size} bytes). 

The image content could not be automatically analyzed. Please describe the content you see in the image and paste it in the manual content input field for the best study experience.`;
      
    } catch (error) {
      console.error('Error extracting image content:', error);
      throw new Error(`Failed to extract image content: ${error.message}`);
    }
  }


  private createEnhancedFallbackChunks(content: string, fileName: string, fileType: string): StudyChunk[] {
    console.log('Creating enhanced fallback chunks from content...');
    
    // Enhanced fallback: intelligent text splitting
    const sections = this.splitContentIntelligently(content);
    const chunks: StudyChunk[] = [];
    
    sections.forEach((section, index) => {
      if (section.trim().length < 50) return; // Skip very short sections
      
      const keywords = this.extractKeywords(section);
      const estimatedTime = Math.max(10, Math.min(30, Math.round(section.length / 200))); // 10-30 minutes
      
      chunks.push({
        id: `enhanced-fallback-chunk-${index}`,
        title: this.generateSectionTitle(section, index),
        content: [{
          id: `enhanced-fallback-content-${index}`,
          type: fileType as any,
          title: this.generateSectionTitle(section, index),
          content: section,
          complexity: this.estimateComplexity(section),
          estimatedTime: estimatedTime,
          dependencies: [],
          keywords: keywords,
          sourceFile: fileName,
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
    
    console.log(`Created ${chunks.length} enhanced fallback chunks`);
    return chunks;
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
      console.log('Creating intelligent chunks with OpenAI model...');
      console.log('Content to process:', content.substring(0, 200) + '...');
      
      // Test AI connection first
      const aiWorking = await this.openRouterClient.testAI();
      if (!aiWorking) {
        console.warn('AI test failed, using fallback chunking');
        return this.createPageBasedChunks(fileName, fileType);
      }
      
      // Use OpenAI model to analyze and chunk the content
      const aiResponse = await this.openRouterClient.analyzeTextContent(content, 'chunking');
      
      console.log('AI Response received:', aiResponse.substring(0, 500) + '...');
      
      // Check if the response contains the system prompt (this indicates an error)
      if (aiResponse.includes('You are an expert at creating study chunks') || 
          aiResponse.includes('IMPORTANT: You must analyze') ||
          aiResponse.includes('Format your response like this')) {
        console.error('AI returned system prompt instead of content. This indicates an API issue.');
        throw new Error('AI service returned system prompt instead of generated content');
      }
      
      // Parse AI response - handle both JSON and text responses
      let aiChunks;
      try {
        // First try to parse as JSON
        aiChunks = JSON.parse(aiResponse);
        if (!Array.isArray(aiChunks)) {
          throw new Error('AI response is not an array');
        }
      } catch (parseError) {
        console.log('AI response is text format, processing as structured content');
        // If not JSON, treat as structured text and extract chunks
        aiChunks = this.parseTextResponseToChunks(aiResponse);
      }

      // Convert AI response to StudyChunk objects
      const chunks: StudyChunk[] = aiChunks.map((chunk: any, index: number) => ({
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
      }));

      console.log(`Created ${chunks.length} intelligent chunks with OpenAI`);
      return chunks;
    } catch (error) {
      console.error('AI chunking failed, using fallback:', error);
      return this.createPageBasedChunks(fileName, fileType);
    }
  }

  private async extractKeyConcepts(content: string): Promise<string[]> {
    try {
      console.log('Extracting key concepts with OpenAI model...');
      
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
        console.log(`Extracted ${concepts.length} key concepts with OpenAI`);
        return concepts.slice(0, 10); // Limit to 10 concepts
      } else {
        throw new Error('AI response is not an array');
      }
    } catch (error) {
      console.error('AI key concept extraction failed, using fallback:', error);
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
    console.log('Creating fallback chunks from AI response');
    
    // If we have some content, try to create meaningful chunks
    if (textResponse && textResponse.trim().length > 50) {
      // Split content into paragraphs and create chunks
      const paragraphs = textResponse.split(/\n\s*\n/).filter(p => p.trim().length > 20);
      
      if (paragraphs.length > 0) {
        return paragraphs.slice(0, 4).map((paragraph, index) => ({
          title: `Section ${index + 1}`,
          content: paragraph.trim(),
          estimatedTime: 15,
          complexity: 5,
          learningObjectives: [
            "Understand the key concepts presented",
            "Apply the knowledge to practical situations"
          ],
          keywords: this.extractKeywordsFromText(paragraph),
          assessmentQuestions: [
            "What are the main points covered in this section?",
            "How can you apply this knowledge?"
          ],
          prerequisites: []
        }));
      }
    }
    
    // Create basic chunks based on the original content
    return [
      {
        title: "Content Analysis",
        content: textResponse || "Content was processed but no specific chunks could be extracted. This section contains the general information from the uploaded material.",
        estimatedTime: 15,
        complexity: 5,
        learningObjectives: [
          "Understand the general content of the uploaded material",
          "Identify key information from the source"
        ],
        keywords: this.extractKeywordsFromText(textResponse || "content material information"),
        assessmentQuestions: [
          "What is the main topic of this content?",
          "What are the key points discussed?"
        ],
        prerequisites: []
      },
      {
        title: "Key Concepts",
        content: "This section focuses on the important concepts and ideas presented in the uploaded material. Review the content carefully to identify the main themes and concepts.",
        estimatedTime: 15,
        complexity: 5,
        learningObjectives: [
          "Identify the main concepts from the material",
          "Understand the relationships between different concepts"
        ],
        keywords: this.extractKeywordsFromText("concepts ideas themes"),
        assessmentQuestions: [
          "What are the main concepts discussed?",
          "How do these concepts relate to each other?"
        ],
        prerequisites: ["Content Analysis"]
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


  // Extract keywords from content
  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'from', 'into', 'during', 'including', 'until', 'against', 'among', 'throughout', 'despite', 'towards', 'upon', 'concerning', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once']);
    
    const keywords = [...new Set(words.filter(word => 
      word.length > 3 && 
      !commonWords.has(word) && 
      /^[a-zA-Z]+$/.test(word)
    ))].slice(0, 5);
    
    return keywords;
  }

  // Generate fallback learning objectives from content
  private generateFallbackObjectives(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const objectives = [];
    
    // Extract key concepts and create objectives
    const keywords = this.extractKeywords(content);
    if (keywords.length > 0) {
      objectives.push(`Understand the concept of ${keywords[0]}`);
    }
    
    if (sentences.length > 0) {
      objectives.push(`Learn about ${sentences[0].trim().substring(0, 50)}...`);
    }
    
    if (keywords.length > 1) {
      objectives.push(`Apply knowledge of ${keywords[1]} in practical scenarios`);
    }
    
    return objectives.slice(0, 3); // Return max 3 objectives
  }

  // Generate fallback assessment questions from content
  private generateFallbackQuestions(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keywords = this.extractKeywords(content);
    const questions = [];
    
    if (keywords.length > 0) {
      questions.push(`What is ${keywords[0]} and how does it work?`);
    }
    
    if (sentences.length > 0) {
      questions.push(`Explain the main points discussed in this section`);
    }
    
    if (keywords.length > 1) {
      questions.push(`How does ${keywords[0]} relate to ${keywords[1]}?`);
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

  // Simple page-based chunking methods
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

  private extractBasicKeyConcepts(fileName: string): string[] {
    // Extract key concepts from filename
    const words = fileName.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(word => word.length > 2);
    return words.slice(0, 5); // Return first 5 meaningful words
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
}

// Singleton instance
export const contentProcessor = new ContentProcessor();

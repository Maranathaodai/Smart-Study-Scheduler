import axios from 'axios';
import { CONFIG, getOpenRouterApiKey } from './config';

// Use configuration for API settings
const OPENROUTER_API_URL = CONFIG.OPENROUTER.API_URL;

// Free models available on OpenRouter
export const FREE_MODELS = CONFIG.OPENROUTER.MODELS;

interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{
      type: string;
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }>;
  max_tokens?: number;
  temperature?: number;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterClient {
  private getApiKey(): string {
    // Get API key dynamically each time to ensure fresh environment access
    return getOpenRouterApiKey();
  }

  constructor() {
    // No longer store API key in constructor - get it dynamically
  }

  async makeRequest(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    // List of working free models to try in order of preference
    const modelsToTry = [
      request.model, // Try requested model first
      'google/gemma-2-9b-it:free',
      'mistralai/mistral-7b-instruct:free'
    ];

    let lastError: any;

    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model}`);
        
        const response = await axios.post(
          `${OPENROUTER_API_URL}/chat/completions`,
          {
            ...request,
            model: model,
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://smart-study-scheduler.vercel.app/',
              'X-Title': 'Smart Study Scheduler'
            },
            timeout: 30000, // 30 second timeout
          }
        );

        console.log(`Successfully used model: ${model}`);
        return response.data;
      } catch (error: any) {
        console.log(`Model ${model} failed:`, error.response?.status || error.message);
        lastError = error;
        
        // If it's not a model availability issue, break early
        if (error.response?.status !== 404 && error.response?.status !== 402) {
          // Still try other models for these errors
          continue;
        }
      }
    }

    // If all models failed, throw the last error
    throw new Error(`All models failed. Last error: ${lastError.response?.data?.error?.message || lastError.message}`);
  }

  // Test AI connectivity
  async testAI(): Promise<boolean> {
    try {
      const response = await this.makeRequest({
        model: FREE_MODELS.GENERAL,
        messages: [
          {
            role: 'user',
            content: 'Say "AI is working" if you can respond.'
          }
        ],
        max_tokens: 10,
        temperature: 0
      });

      const content = response.choices[0].message.content.toLowerCase();
      return content.includes('working') || content.includes('ai');
    } catch (error) {
      console.error('AI test failed:', error);
      return false;
    }
  }

  // Enhanced PDF extraction using vision models
  async extractStructuredPDFContent(base64Content: string): Promise<string> {
    console.log('🤖 Starting robust PDF processing...');
    console.log('� Base64 content length:', base64Content.length);
    
    try {
      // Method 1: Try AI vision model for direct PDF processing
      console.log('🔍 Attempting AI vision extraction...');
      try {
        const visionResponse = await this.makeRequest({
          model: 'google/gemini-flash-1.5:free',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all readable text from this PDF. Return ONLY the actual text content, properly formatted with clear sections and headings. Do not add commentary about the PDF structure.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:application/pdf;base64,${base64Content}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000,
          temperature: 0.1
        });

        const visionContent = visionResponse.choices[0].message.content;
        
        if (this.isValidExtractedContent(visionContent)) {
          console.log('✅ Vision extraction successful');
          console.log('📄 Sample:', visionContent.substring(0, 200));
          return this.cleanExtractedText(visionContent);
        }
      } catch (visionError) {
        console.log('❌ Vision extraction failed:', visionError.message);
      }

      // Method 2: Smart text pattern extraction
      console.log('📝 Attempting pattern-based extraction...');
      const extractedText = this.extractPDFPatterns(base64Content);
      
      if (this.isValidExtractedContent(extractedText)) {
        console.log('✅ Pattern extraction successful');
        return this.cleanExtractedText(extractedText);
      }

      // Method 3: AI-assisted text recovery from partial data
      if (extractedText.length > 20) {
        console.log('🔧 Attempting AI text reconstruction...');
        try {
          const reconstructed = await this.reconstructTextFromPDF(extractedText);
          if (this.isValidExtractedContent(reconstructed)) {
            console.log('✅ AI reconstruction successful');
            return this.cleanExtractedText(reconstructed);
          }
        } catch (reconstructError) {
          console.log('❌ AI reconstruction failed:', reconstructError.message);
        }
      }

      // Method 4: Graceful fallback with guidance
      console.log('⚠️ All extraction methods failed, providing user guidance');
      return this.createHelpfulGuidance(base64Content.length);
      
    } catch (error) {
      console.error('PDF processing error:', error);
      return this.createHelpfulGuidance(base64Content.length);
    }
  }

  // Helper method to validate extracted content quality
  private isValidExtractedContent(content: string): boolean {
    if (!content || content.length < 50) return false;
    
    // Check for readable character ratio
    const readableChars = content.match(/[a-zA-Z0-9\s.,!?;:()]/g)?.length || 0;
    const readableRatio = readableChars / content.length;
    
    // Check for common garbage patterns
    const garbagePatterns = [
      /^[\s\W]*$/,  // Only whitespace/symbols
      /[^\x20-\x7E\n\r\t]{10,}/,  // Long sequences of non-printable chars
      /^[a-zA-Z0-9\s]{0,10}$/,  // Too short readable content
      /this appears to be|it might be|without context|impossible to tell/i
    ];
    
    const hasGarbage = garbagePatterns.some(pattern => pattern.test(content));
    
    console.log(`📊 Content validation: ${content.length} chars, ${(readableRatio * 100).toFixed(1)}% readable, garbage: ${hasGarbage}`);
    
    return readableRatio > 0.7 && !hasGarbage;
  }

  // Helper method to extract text using improved patterns
  private extractTextPatterns(base64Content: string): string {
    try {
      const decodedContent = atob(base64Content);
      let extractedTexts: string[] = [];
      
      // Pattern 1: Text in PDF streams
      const streamPattern = /stream\s*([\s\S]*?)\s*endstream/gi;
      let streamMatch;
      while ((streamMatch = streamPattern.exec(decodedContent)) !== null) {
        const streamContent = streamMatch[1];
        
        // Look for text commands within streams
        const textCommands = [
          /\(([^)]+)\)\s*Tj/g,
          /\[([^\]]+)\]\s*TJ/g,
          /BT\s*(.*?)\s*ET/gs
        ];
        
        for (const command of textCommands) {
          let textMatch;
          while ((textMatch = command.exec(streamContent)) !== null) {
            const text = textMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\(.)/g, '$1')
              .trim();
            
            if (text.length > 2 && /[a-zA-Z]/.test(text)) {
              extractedTexts.push(text);
            }
          }
        }
      }
      
      // Pattern 2: Direct text objects
      const directTextPattern = /\(([^)]+)\)/g;
      let directMatch;
      while ((directMatch = directTextPattern.exec(decodedContent)) !== null) {
        const text = directMatch[1];
        if (text.length > 3 && /[a-zA-Z]{3,}/.test(text)) {
          extractedTexts.push(text);
        }
      }
      
      return extractedTexts.join(' ').trim();
    } catch (error) {
      console.log('Pattern extraction error:', error.message);
      return '';
    }
  }

  // Helper method to reconstruct text using AI
  private async reconstructTextWithAI(partialText: string): Promise<string> {
    const response = await this.makeRequest({
      model: FREE_MODELS.TEXT_ANALYSIS,
      messages: [
        {
          role: 'system',
          content: 'You are helping recover readable text from partial PDF extraction. Clean up and organize the text into readable content. Remove obvious encoding artifacts and reconstruct proper sentences.'
        },
        {
          role: 'user',
          content: `Clean and organize this extracted text: ${partialText.substring(0, 2000)}`
        }
      ],
      max_tokens: 3000,
      temperature: 0.1
    });

    return response.choices[0].message.content;
  }

  // Helper method to clean extracted text
  private cleanExtractedText(text: string): string {
    return text
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2')  // Add paragraph breaks
      .replace(/([a-z])([A-Z])/g, '$1 $2')  // Add spaces between camelCase
      .trim();
  }

  // Helper method to create helpful guidance
  private createHelpfulGuidance(fileSize: number): string {
    const sizeKB = Math.round(fileSize * 0.75 / 1024); // Approximate original size
    
    return `# PDF Content Extraction

**File Information:** ${sizeKB}KB PDF document

This PDF file couldn't be automatically processed. This often happens with:
- Scanned documents (images of text)
- Password-protected files  
- Complex layouts with graphics
- Encoded or compressed content

## 📋 Manual Content Input (Recommended)

**For best results:**
1. **Open** your PDF in any PDF viewer
2. **Select All** text (Ctrl+A / Cmd+A)
3. **Copy** the content (Ctrl+C / Cmd+C)  
4. **Return** to this app
5. **Use** "Add Content Manually" option
6. **Paste** your content

## 🎯 Content Organization Tips

**For CV/Resume:**
- Personal Information
- Professional Summary
- Education & Qualifications
- Work Experience  
- Skills & Competencies
- Projects & Achievements

**For Study Materials:**
- Chapter/Section titles
- Key concepts & definitions
- Examples & case studies
- Summary points

*This manual approach ensures 100% accuracy and proper formatting for your study sessions.*`;
  }

  // Standard PDF content extraction (fallback method)
  async extractTextFromPDF(base64Content: string): Promise<string> {
    try {
      console.log('🤖 Extracting text from PDF using standard AI...');
      
      const response = await this.makeRequest({
        model: FREE_MODELS.PDF_PROCESSING_FALLBACK || FREE_MODELS.TEXT_ANALYSIS,
        messages: [
          {
            role: 'system',
            content: `Extract all readable text content from this PDF document. Return only the extracted text in a clean, readable format.`
          },
          {
            role: 'user',
            content: `Please extract all text from this PDF document: ${base64Content.substring(0, 1000)}...`
          }
        ],
        max_tokens: 3000,
        temperature: 0.1
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error(`Failed to extract PDF text: ${error.message}`);
    }
  }

  // Enhanced image content analysis with vision models
  async analyzeImageContentEnhanced(base64Content: string): Promise<string> {
    try {
      console.log('🤖 Analyzing image content using enhanced AI...');
      
      const response = await this.makeRequest({
        model: FREE_MODELS.IMAGE_ANALYSIS,
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing educational images and extracting structured learning content. Create professional study material from images.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this educational image and extract all content for studying. Format as structured study material with headers, key points, and explanations.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Content}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing image content with enhanced AI:', error);
      throw new Error(`Failed to analyze image content: ${error.message}`);
    }
  }

  // Standard image content analysis (fallback method)
  async analyzeImageContent(base64Content: string): Promise<string> {
    try {
      console.log('🤖 Analyzing image content using standard AI...');
      
      const response = await this.makeRequest({
        model: FREE_MODELS.TEXT_ANALYSIS,
        messages: [
          {
            role: 'system',
            content: `Analyze this image and extract any educational content. Focus on text extraction and content analysis.`
          },
          {
            role: 'user',
            content: `Please analyze this image: ${base64Content.substring(0, 1000)}...`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing image content:', error);
      throw new Error(`Failed to analyze image content: ${error.message}`);
    }
  }

  // AI-powered text content analysis for creating study chunks
  async analyzeTextContent(content: string, analysisType: 'chunking' | 'concepts' = 'chunking'): Promise<string> {
    try {
      console.log('🤖 Sending content to AI for analysis...');
      console.log('📄 Content length:', content.length);
      console.log('📄 First 300 characters of content being sent:', content.substring(0, 300));
      console.log('📄 User prompt length:', content.length + 500);

      let systemPrompt = '';
      let userPrompt = '';

      if (analysisType === 'chunking') {
        systemPrompt = `Create study chunks from educational content. Return only valid JSON array.

Format:
[{
  "title": "Topic Name",
  "content": "# Topic Name\n\n## Overview\nExplain the concept clearly.\n\n## Key Points\n- Important detail 1\n- Important detail 2\n\n## Summary\nBrief summary of the topic.",
  "estimatedTime": 15,
  "complexity": 5,
  "learningObjectives": ["Learn concept X", "Understand Y"],
  "keywords": ["term1", "term2"],
  "assessmentQuestions": ["What is X?", "How does Y work?"],
  "prerequisites": []
}]

Return only the JSON array, no other text.`;

        userPrompt = `Create study chunks from this content:

${content.substring(0, 2000)}`;
      } else {
        systemPrompt = `Extract key concepts. Return ONLY a JSON array of strings. No explanations.`;
        userPrompt = `Key concepts from: ${content.substring(0, 1500)}`;
      }

      const response = await this.makeRequest({
        model: FREE_MODELS.CONTENT_CHUNKING,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      });

      let result = response.choices[0].message.content;
      
      // Enhanced filtering for system prompt echoes and meta-commentary
      const unwantedPhrases = [
        'you are an expert',
        'you are an educational',
        'chunking requirements', 
        'transform educational content',
        'return only a json array',
        'no explanations',
        'important:',
        'chunk format',
        'rules:',
        'guidelines:',
        'each chunk format:',
        'writing style guidelines',
        'analyze this educational content',
        'create study chunks',
        'this appears to be',
        'it\'s possible it\'s',
        'it might be code',
        'without context',
        'impossible to tell',
        'large chunk of random text',
        'no clear meaning',
        'snippet of raw data'
      ];
      
      const resultLower = result.toLowerCase();
      const containsUnwanted = unwantedPhrases.some(phrase => resultLower.includes(phrase));
      
      if (containsUnwanted) {
        console.warn('⚠️ AI response contains meta-commentary instead of content, using fallback');
        throw new Error('AI returned meta-commentary instead of actual content');
      }
      
      console.log('AI analysis complete, response length:', result.length);
      
      return result;
    } catch (error) {
      console.error('Error analyzing content with AI:', error);
      throw new Error(`Failed to analyze content: ${error.message}`);
    }
  }

  async extractKeyConcepts(content: string): Promise<string> {
    try {
      console.log('🧠 Extracting key concepts from content...');
      
      const response = await this.makeRequest({
        model: FREE_MODELS.TEXT_ANALYSIS || 'google/gemma-2-9b-it:free',
        messages: [
          {
            role: 'system',
            content: `You are an expert at identifying key educational concepts from study material. Extract the most important concepts, topics, and learning points.

INSTRUCTIONS:
- Return a JSON array of strings
- Each string should be a concise key concept or topic
- Focus on the main learning objectives
- Limit to 10 most important concepts
- Use clear, specific terminology
- Avoid overly general terms

FORMAT: Return only a JSON array like: ["concept 1", "concept 2", "concept 3"]`
          },
          {
            role: 'user',
            content: `Extract key concepts from this educational content:\n\n${content.substring(0, 3000)}`
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error extracting key concepts:', error);
      
      // Check for specific rate limit errors
      if (error.message && error.message.includes('Rate limit exceeded')) {
        throw new Error('RATE_LIMIT_EXCEEDED: AI service has reached daily free quota. App will use offline processing.');
      }
      
      if (error.message && error.message.includes('free-models-per-day')) {
        throw new Error('DAILY_QUOTA_EXCEEDED: Free AI quota exhausted. Switching to offline mode for reliable content processing.');
      }
      
      throw new Error(`Failed to extract key concepts: ${error.message}`);
    }
  }

  // Helper methods for PDF processing

  private extractPDFPatterns(base64Content: string): string {
    // Simulate pattern-based text extraction
    console.log('🔍 Attempting pattern-based extraction...');
    
    try {
      // Decode base64 and look for text patterns
      const buffer = Buffer.from(base64Content, 'base64');
      const content = buffer.toString('latin1');
      
      // Extract readable text patterns
      const textMatches = content.match(/[a-zA-Z][a-zA-Z0-9\s.,!?;:()\-]{10,}/g) || [];
      const extractedText = textMatches.join(' ').replace(/\s+/g, ' ').trim();
      
      console.log(`📊 Pattern extraction found ${extractedText.length} characters`);
      return extractedText;
    } catch (error) {
      console.log('❌ Pattern extraction failed:', error.message);
      return '';
    }
  }

  private async reconstructTextFromPDF(partialText: string): Promise<string> {
    console.log('🔧 Attempting AI text reconstruction...');
    
    try {
      const response = await this.makeRequest({
        model: FREE_MODELS.TEXT_ANALYSIS,
        messages: [
          {
            role: 'system',
            content: `You are helping reconstruct readable text from corrupted PDF extraction. 
The input contains fragments and partial words. Your task is to:
1. Identify meaningful text fragments
2. Reconstruct complete sentences where possible
3. Remove obvious corruption/garbage
4. Maintain original meaning and structure
5. Return only the reconstructed readable text

Do not add commentary or explanations. Return only the cleaned, reconstructed text.`
          },
          {
            role: 'user',
            content: `Reconstruct readable text from this corrupted PDF extraction:\n\n${partialText}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      });

      const reconstructed = response.choices[0].message.content.trim();
      console.log(`🔧 Reconstruction result: ${reconstructed.length} characters`);
      return reconstructed;
    } catch (error) {
      console.log('❌ AI reconstruction failed:', error.message);
      return partialText;
    }
  }

  private validatePDFExtraction(content: string): { isValid: boolean; confidence: number; issues: string[] } {
    console.log('🔍 Validating PDF extraction quality...');
    
    const issues: string[] = [];
    let confidence = 100;
    
    // Check readable character ratio
    const readableChars = content.match(/[a-zA-Z0-9\s.,!?;:()\-]/g)?.length || 0;
    const readableRatio = readableChars / content.length;
    
    if (readableRatio < 0.7) {
      issues.push(`Low readable character ratio: ${(readableRatio * 100).toFixed(1)}%`);
      confidence -= 30;
    }
    
    // Check for PDF artifacts
    const artifactPatterns = [
      /\/\w+\s+\d+\s+R/g,
      /stream\s+.*?endstream/g,
      /BT\s+.*?ET/g
    ];
    
    const artifactCount = artifactPatterns.reduce((count, pattern) => {
      return count + (content.match(pattern)?.length || 0);
    }, 0);
    
    if (artifactCount > 5) {
      issues.push(`High PDF artifact count: ${artifactCount}`);
      confidence -= 25;
    }
    
    // Check for meaningful words
    const words = content.match(/\b[a-zA-Z]{2,}\b/g) || [];
    if (words.length < 10) {
      issues.push(`Insufficient meaningful words: ${words.length}`);
      confidence -= 20;
    }
    
    const isValid = confidence > 50 && issues.length < 3;
    
    console.log(`📊 Validation result: ${isValid ? 'PASS' : 'FAIL'} (confidence: ${confidence}%)`);
    if (issues.length > 0) {
      console.log(`⚠️ Issues: ${issues.join(', ')}`);
    }
    
    return { isValid, confidence, issues };
  }
}

// Singleton instance
export const openRouterClient = new OpenRouterClient();
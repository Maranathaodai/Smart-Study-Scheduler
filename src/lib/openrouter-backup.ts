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
    try {
      console.log('🤖 Extracting structured content from PDF using enhanced AI...');
      console.log('📄 Base64 content length:', base64Content.length);
      
      const response = await this.makeRequest({
        model: FREE_MODELS.PDF_PROCESSING, // Now uses anthropic/claude-3-haiku:beta
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting and structuring educational content from PDF documents. Create high-quality study material with:

EXTRACTION REQUIREMENTS:
- Extract ALL readable text content from the document
- Preserve document structure (headers, sections, subsections)
- Maintain lists, bullet points, and numbered items
- Keep table data organized and readable
- Preserve important formatting and emphasis
- Extract formulas, equations, or technical content
- Include any visible charts/diagram descriptions

OUTPUT FORMAT:
Structure as professional study material using markdown:
# Main Document Title
## Major Sections  
### Subsections
- Key points as bullets
- Important concepts with **emphasis**
- Technical terms in \`code formatting\`
#### Learning Objectives (if applicable)
- What students should understand
- Skills to develop

CRITICAL: Return ONLY the extracted and structured content, no meta-commentary about the extraction process.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please extract and structure all educational content from this PDF document. Format it as comprehensive study material with proper headers, sections, and key points. Focus on creating high-quality, well-organized content for learning.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Content.substring(0, 20000)}`
                }
              }
            ]
          }
        ],
        max_tokens: 3000,
        temperature: 0.3
      });

      const extractedText = response.choices[0].message.content;
      console.log('PDF extraction result:', extractedText.substring(0, 300) + '...');
      
      return extractedText;
    } catch (error) {
      console.error('Error extracting structured PDF content:', error);
      throw new Error(`Failed to extract PDF content: ${error.message}`);
    }
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
        systemPrompt = `You are an expert at creating study chunks from educational content. Transform content into well-structured, engaging study material.

CHUNKING REQUIREMENTS:
- Create 3-6 logical study chunks from the content
- Each chunk should be 10-25 minutes of study time
- Preserve learning flow and concept dependencies
- Include clear titles that capture the main concept
- Add learning objectives for each chunk
- Include key terms and assessment questions

CHUNK FORMAT for each chunk:
{
  "title": "Clear, descriptive title (not generic)",
  "content": "Well-formatted markdown content with headers, bullets, emphasis",
  "estimatedTime": 15,
  "complexity": 5,
  "learningObjectives": ["Specific learning goal 1", "Specific learning goal 2"],
  "keywords": ["key", "terms"],
  "assessmentQuestions": ["Question testing understanding"],
  "prerequisites": []
}

Return valid JSON array of chunks. Focus on educational value and clear structure.`;

        userPrompt = `Create intelligent study chunks from this educational content. Structure each chunk with proper markdown formatting and educational elements:\n\n${content}`;
      } else {
        systemPrompt = `Extract 5-10 key concepts from educational content. Return only a JSON array of strings.`;
        userPrompt = `Extract key concepts from: ${content}`;
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
        max_tokens: 3000,
        temperature: 0.7
      });

      const result = response.choices[0].message.content;
      console.log('AI analysis complete, response length:', result.length);
      
      return result;
    } catch (error) {
      console.error('Error analyzing content with AI:', error);
      throw new Error(`Failed to analyze content: ${error.message}`);
    }
  }
}

// Singleton instance
export const openRouterClient = new OpenRouterClient();
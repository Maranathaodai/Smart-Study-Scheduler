import axios from 'axios';
import { CONFIG, getOpenRouterApiKey } from './config';

// Use configuration for API settings
const OPENROUTER_API_URL = CONFIG.OPENROUTER.API_URL;
const OPENROUTER_API_KEY = getOpenRouterApiKey();

// Free models available on OpenRouter
export const FREE_MODELS = CONFIG.OPENROUTER.MODELS;

interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
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
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || OPENROUTER_API_KEY;
    if (!this.apiKey) {
      console.warn('OpenRouter API key not provided. Some features may not work.');
    }
  }

  async makeRequest(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    // List of GPT-style models to try in order of preference
    const modelsToTry = [
      request.model, // Try the requested model first
      'google/gemma-2-9b-it:free',
      'google/gemma-2-2b-it:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'deepseek/deepseek-chat-v3.1:free',
    ];

    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model}`);
        
        const response = await axios.post(
          `${OPENROUTER_API_URL}/chat/completions`,
          {
            ...request,
            model: model,
            stream: false,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://smart-study-scheduler.app',
              'X-Title': 'Smart Study Scheduler',
            },
          }
        );

        console.log(`Successfully used model: ${model}`);
        return response.data;
      } catch (error) {
        console.error(`Model ${model} failed:`, error.response?.status, error.response?.data?.error?.message);
        lastError = error;
        
        // If it's a 404 (model not found), try the next model
        if (error.response?.status === 404) {
          continue;
        }
        
        // For other errors, break and throw
        break;
      }
    }

    // If all models failed, throw the last error with detailed information
    console.error('All models failed. Last error:', lastError);
    
    if (lastError?.response) {
      console.error('Response status:', lastError.response.status);
      console.error('Response data:', lastError.response.data);
      
      if (lastError.response.status === 403) {
        throw new Error(`OpenRouter API access denied (403). Please check your API key and model permissions. Response: ${JSON.stringify(lastError.response.data)}`);
      } else if (lastError.response.status === 401) {
        throw new Error(`OpenRouter API authentication failed (401). Please check your API key. Response: ${JSON.stringify(lastError.response.data)}`);
      } else if (lastError.response.status === 429) {
        throw new Error(`OpenRouter API rate limit exceeded (429). Please try again later. Response: ${JSON.stringify(lastError.response.data)}`);
      } else {
        throw new Error(`OpenRouter API request failed with status ${lastError.response.status}: ${JSON.stringify(lastError.response.data)}`);
      }
    } else if (lastError?.request) {
      throw new Error(`OpenRouter API request failed - no response received: ${lastError.message}`);
    } else {
      throw new Error(`OpenRouter API request setup failed: ${lastError.message}`);
    }
  }

  async analyzeTextContent(text: string, analysisType: 'complexity' | 'segmentation' | 'chunking'): Promise<string> {
    const systemPrompts = {
      complexity: `You are an expert educational content analyzer. Analyze the given text and provide a complexity score from 1-10, where:
- 1-3: Basic concepts, simple vocabulary, minimal prerequisites
- 4-6: Intermediate concepts, some technical terms, moderate prerequisites  
- 7-10: Advanced concepts, complex technical terms, significant prerequisites

Also identify key concepts, learning objectives, and estimated study time in minutes.`,
      
      segmentation: `You are an expert at segmenting educational content. Analyze the given text and identify natural content boundaries where topics or concepts change. Return a JSON array of segments with titles and content boundaries.`,
      
      chunking: `You are an expert at creating beautiful, engaging study chunks from educational content. 

IMPORTANT: Create study chunks that are visually appealing and easy to study. Use proper markdown formatting to make the content engaging and well-structured.

For the content provided, create 2-4 study chunks. Each chunk should:

1. Have a clear, engaging title based on the actual content
2. Contain well-formatted content with proper markdown
3. Include learning objectives as a bulleted list
4. Include assessment questions as a numbered list
5. Use markdown formatting for emphasis, lists, and structure

Format your response using proper markdown like this:

## 📚 Chunk 1: [Engaging Title Based on Actual Content]

**Content Summary:**
[Extract and summarize the actual content here - use **bold** for key terms, *italics* for emphasis, and proper paragraph breaks]

**Key Points:**
- [Important point from the actual content]
- [Another important point]
- [Third important point]

**Learning Objectives:**
- ✅ Understand [specific concept from the actual content]
- ✅ Apply [specific knowledge from the actual content]
- ✅ Analyze [specific relationship from the actual content]

**Assessment Questions:**
1. What is [specific concept from the actual content]?
2. How does [specific concept from the actual content] work?
3. Can you explain [specific concept from the actual content] in your own words?

---

## 📚 Chunk 2: [Second Engaging Title Based on Actual Content]

**Content Summary:**
[Extract and summarize more actual content from the source material]

**Key Points:**
- [Important point from the actual content]
- [Another important point]

**Learning Objectives:**
- ✅ Master [specific concept from the actual content]
- ✅ Compare [specific concepts from the actual content]

**Assessment Questions:**
1. Explain [specific concept from the actual content]
2. Compare [specific concepts from the actual content]

Remember: Extract and summarize the ACTUAL CONTENT provided, not generic examples. Use engaging markdown formatting to make it visually appealing and easy to study.`
    };

    const userPrompt = analysisType === 'complexity' 
      ? `Analyze this educational content:\n\n${text}`
      : analysisType === 'chunking'
      ? `Create study chunks from this content. Extract the actual information and create meaningful learning sections:\n\n${text}`
      : `Process this educational content for ${analysisType}:\n\n${text}`;

    const response = await this.makeRequest({
      model: FREE_MODELS.TEXT_ANALYSIS,
      messages: [
        { role: 'system', content: systemPrompts[analysisType] },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    return response.choices[0].message.content;
  }

  // Test function to verify AI is working correctly
  async testAI(): Promise<boolean> {
    try {
      console.log('Testing AI connection...');
      const testResponse = await this.makeRequest({
        model: FREE_MODELS.TEXT_ANALYSIS,
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant. Respond with "AI is working" if you receive this message.' 
          },
          { 
            role: 'user', 
            content: 'Test message' 
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      });

      const response = testResponse.choices[0].message.content;
      console.log('AI test response:', response);
      
      if (response.includes('AI is working') || response.includes('working')) {
        console.log('✅ AI is working correctly');
        return true;
      } else {
        console.log('❌ AI returned unexpected response:', response);
        return false;
      }
    } catch (error) {
      console.error('❌ AI test failed:', error);
      return false;
    }
  }

  // Extract text from PDF using AI
  async extractTextFromPDF(base64Content: string): Promise<string> {
    try {
      console.log('Extracting text from PDF using AI...');
      
      const response = await this.makeRequest({
        model: FREE_MODELS.TEXT_ANALYSIS,
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting and analyzing content from PDF files. 

Your task is to extract the actual text content from the PDF file provided. 

IMPORTANT INSTRUCTIONS:
1. Extract ONLY the readable text content from the PDF
2. Ignore PDF metadata, formatting codes, and structural elements
3. If there are images, describe what you see in them
4. Preserve the logical structure and flow of the content
5. Return clean, readable text that can be used for study purposes
6. Do not include PDF technical information or binary data

Return the extracted text in a clean, readable format that maintains the original meaning and structure.`
          },
          {
            role: 'user',
            content: `Please extract the text content from this PDF file. The file is base64 encoded: ${base64Content.substring(0, 2000)}...`
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      });

      const extractedText = response.choices[0].message.content;
      console.log('PDF text extraction result:', extractedText.substring(0, 300) + '...');
      
      return extractedText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  // Analyze image content using AI
  async analyzeImageContent(base64Content: string): Promise<string> {
    try {
      console.log('Analyzing image content using AI...');
      
      const response = await this.makeRequest({
        model: FREE_MODELS.TEXT_ANALYSIS,
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing images and extracting educational content. 

Your task is to analyze the image provided and extract any text content, describe visual elements, and create educational material from what you see.

IMPORTANT INSTRUCTIONS:
1. If the image contains text, transcribe it accurately
2. Describe any diagrams, charts, or visual elements
3. Identify key concepts and learning points
4. Create educational content that can be used for study
5. If it's a document or screenshot, extract the main information
6. Return clean, readable text suitable for study purposes

Return the analysis in a structured, educational format.`
          },
          {
            role: 'user',
            content: `Please analyze this image and extract any educational content. The image is base64 encoded: ${base64Content.substring(0, 2000)}...`
          }
        ],
        max_tokens: 3000,
        temperature: 0.1
      });

      const imageAnalysis = response.choices[0].message.content;
      console.log('Image analysis result:', imageAnalysis.substring(0, 300) + '...');
      
      return imageAnalysis;
    } catch (error) {
      console.error('Error analyzing image content:', error);
      throw new Error(`Failed to analyze image content: ${error.message}`);
    }
  }

  async generateStudyQuestions(content: string): Promise<string> {
    const response = await this.makeRequest({
      model: FREE_MODELS.TEXT_ANALYSIS,
      messages: [
        {
          role: 'system',
          content: `You are an expert educator creating assessment questions. Generate 3-5 thoughtful questions that test understanding of the given content. Include both factual recall and conceptual understanding questions. Return as a JSON array.`
        },
        {
          role: 'user',
          content: `Create study questions for this content:\n\n${content}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.4
    });

    return response.choices[0].message.content;
  }

  async extractKeyConcepts(content: string): Promise<string> {
    const response = await this.makeRequest({
      model: FREE_MODELS.TEXT_ANALYSIS,
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting key concepts from educational content. Analyze the provided content and identify the main concepts, terms, and ideas from the ACTUAL CONTENT. Do not generate generic concepts - extract real concepts from the source material. Return as a JSON array with concept names and brief definitions based on the actual content.`
        },
        {
          role: 'user',
          content: `Extract key concepts from this content:\n\n${content}`
        }
      ],
      max_tokens: 800,
      temperature: 0.2
    });

    return response.choices[0].message.content;
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing OpenRouter API connection...');
      console.log('API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'Not provided');
      console.log('Model:', FREE_MODELS.TEXT_ANALYSIS);
      
      const response = await this.makeRequest({
        model: FREE_MODELS.TEXT_ANALYSIS,
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message. Please respond with "API connection successful".'
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      });

      console.log('API test successful:', response.choices[0].message.content);
      return true;
    } catch (error) {
      console.error('API test failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const openRouterClient = new OpenRouterClient();

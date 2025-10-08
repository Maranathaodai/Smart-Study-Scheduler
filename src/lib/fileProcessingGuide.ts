/**
 * File Processing Guide for Smart Study Scheduler
 * 
 * This guide helps users understand which file types work best
 * and how to get the most from the app.
 */

export const FILE_PROCESSING_GUIDE = {
  // Files that work perfectly
  FULLY_SUPPORTED: {
    '.txt': {
      status: '✅ Perfect',
      description: 'Text files work flawlessly with full AI processing',
      tip: 'Best choice for guaranteed processing'
    },
    '.md': {
      status: '✅ Perfect', 
      description: 'Markdown files work perfectly with formatting preserved',
      tip: 'Great for structured documents'
    },
    'manual_input': {
      status: '✅ Perfect',
      description: 'Copy and paste text directly into the app',
      tip: 'Most reliable method for any content'
    }
  },

  // Files with limitations
  LIMITED_SUPPORT: {
    '.pdf': {
      status: '⚠️ Limited',
      description: 'PDFs work only if they contain extractable text',
      limitations: [
        'Scanned documents (images) won\'t work',
        'Password-protected files won\'t work', 
        'Complex formatting may cause issues'
      ],
      alternatives: [
        'Copy text from PDF and paste manually',
        'Save PDF as .txt file',
        'Take screenshots and upload as images'
      ]
    },
    'images': {
      status: '⚠️ Limited',
      description: 'Images work if they contain clear, readable text',
      limitations: [
        'Handwritten text may not be recognized',
        'Low quality images may fail',
        'Complex layouts may cause issues'
      ],
      tip: 'Use high-quality screenshots with clear text'
    }
  },

  // Files not supported
  NOT_SUPPORTED: {
    '.docx/.doc': {
      status: '❌ Not Supported',
      description: 'Word documents require special processing',
      solution: 'Copy text from Word and paste manually, or save as .txt'
    },
    '.pptx/.ppt': {
      status: '❌ Not Supported', 
      description: 'PowerPoint files require special processing',
      solution: 'Copy text from slides and paste manually'
    },
    '.xlsx/.xls': {
      status: '❌ Not Supported',
      description: 'Excel files are not suitable for study content',
      solution: 'Copy relevant text and paste manually'
    }
  }
};

export const RECOMMENDED_WORKFLOW = {
  BEST_PRACTICE: [
    '1. Try uploading .txt files first (most reliable)',
    '2. For PDFs: copy text and use manual input', 
    '3. For other formats: convert to .txt or copy text',
    '4. Use manual text input for guaranteed success'
  ],

  TROUBLESHOOTING: {
    'PDF won\'t process': [
      'Copy all text from the PDF',
      'Paste into manual text input field',
      'Or save PDF as .txt file and upload'
    ],
    'Image text not recognized': [
      'Ensure image has high resolution',
      'Check that text is clearly visible',
      'Try typing out the text manually instead'
    ],
    'File upload fails': [
      'Check file size (should be reasonable)',
      'Try converting to .txt format',
      'Use manual text input as backup'
    ]
  }
};

export function getFileProcessingAdvice(filename: string): string {
  const extension = filename.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'txt':
      return '✅ Perfect! Text files work flawlessly with the app.';
    case 'md':
      return '✅ Great choice! Markdown files work perfectly.';
    case 'pdf':
      return '⚠️ PDFs have limitations. If processing fails, copy the text and use manual input instead.';
    case 'jpg':
    case 'jpeg': 
    case 'png':
      return '⚠️ Images work if text is clear. If processing fails, try typing the text manually.';
    case 'docx':
    case 'doc':
      return '❌ Word docs aren\'t supported. Copy the text and paste manually, or save as .txt file.';
    case 'pptx':
    case 'ppt':
      return '❌ PowerPoint isn\'t supported. Copy text from slides and paste manually.';
    default:
      return '⚠️ This file type may not be supported. Try converting to .txt or using manual text input.';
  }
}

export function getQuickSolutionForError(errorMessage: string): string[] {
  if (errorMessage.includes('PDF Processing Not Available')) {
    return [
      '📋 Copy all text from your PDF',
      '✏️ Use "Manual Text Input" in the app', 
      '📄 Or save PDF as .txt file and upload',
      '📷 Or take clear screenshots and upload as images'
    ];
  }
  
  if (errorMessage.includes('image') || errorMessage.includes('Image')) {
    return [
      '📝 Type out the text from the image manually',
      '📷 Try a higher quality image',
      '📋 Copy any text you can select and paste manually'
    ];
  }
  
  return [
    '📄 Try converting your file to .txt format',
    '📋 Copy text content and use manual input',
    '✏️ Manual text input always works perfectly'
  ];
}
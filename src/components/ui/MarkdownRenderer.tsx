import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface MarkdownRendererProps {
  content: string;
  style?: any;
}

// Simple markdown parser for basic formatting
const parseMarkdown = (text: string) => {
  if (!text) return [];
  
  const lines = text.split('\n');
  const elements: Array<{ type: string; content: string; level?: number; language?: string; variant?: string }> = [];
  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockLanguage = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Handle code blocks
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLanguage = trimmed.substring(3).trim();
        codeBlockContent = '';
      } else {
        inCodeBlock = false;
        elements.push({ 
          type: 'codeBlock', 
          content: codeBlockContent,
          language: codeBlockLanguage 
        });
        codeBlockContent = '';
        codeBlockLanguage = '';
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent += line + '\n';
      continue;
    }
    
    // Handle callout boxes (> [!TYPE])
    if (trimmed.startsWith('> [!')) {
      const calloutMatch = trimmed.match(/^> \[!(INFO|WARNING|SUCCESS|NOTE|TIP)\]/i);
      if (calloutMatch) {
        const variant = calloutMatch[1].toLowerCase();
        // Collect content until empty line or different element
        let calloutContent = trimmed.substring(calloutMatch[0].length).trim();
        let j = i + 1;
        while (j < lines.length && lines[j].trim().startsWith('>')) {
          calloutContent += '\n' + lines[j].substring(1).trim();
          j++;
        }
        elements.push({ 
          type: 'callout', 
          content: calloutContent,
          variant: variant 
        });
        i = j - 1;
        continue;
      }
    }
    
    // Handle blockquotes
    if (trimmed.startsWith('> ')) {
      elements.push({ type: 'blockquote', content: trimmed.substring(2) });
    } else if (trimmed.startsWith('# ')) {
      elements.push({ type: 'heading1', content: trimmed.substring(2) });
    } else if (trimmed.startsWith('## ')) {
      elements.push({ type: 'heading2', content: trimmed.substring(3) });
    } else if (trimmed.startsWith('### ')) {
      elements.push({ type: 'heading3', content: trimmed.substring(4) });
    } else if (trimmed.startsWith('#### ')) {
      elements.push({ type: 'heading4', content: trimmed.substring(5) });
    } else if (trimmed.match(/^\d+\.\s/)) {
      elements.push({ type: 'numberedListItem', content: trimmed.replace(/^\d+\.\s/, '') });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push({ type: 'listItem', content: trimmed.substring(2) });
    } else if (trimmed.startsWith('---')) {
      elements.push({ type: 'divider', content: '' });
    } else if (trimmed.length > 0) {
      elements.push({ type: 'paragraph', content: trimmed });
    } else {
      elements.push({ type: 'spacing', content: '' });
    }
  }
  
  return elements;
};

// Simple text formatter for basic markdown syntax
const formatText = (text: string) => {
  // Handle bold text **text**
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '**$1**');
  
  // Handle italic text *text*
  formatted = formatted.replace(/\*(.*?)\*/g, '*$1*');
  
  // Handle inline code `code`
  formatted = formatted.replace(/`(.*?)`/g, '`$1`');
  
  return formatted;
};

export function MarkdownRenderer({ content, style }: MarkdownRendererProps) {
  const { colors, isDarkMode } = useTheme();
  const elements = parseMarkdown(content);

  const renderElement = (element: { type: string; content: string; level?: number; language?: string; variant?: string }, index: number) => {
    const formattedContent = formatText(element.content);
    
    switch (element.type) {
      case 'heading1':
        return (
          <Text key={index} style={[styles.heading1, { color: colors.primary }]}>
            {formattedContent}
          </Text>
        );
      case 'heading2':
        return (
          <Text key={index} style={[styles.heading2, { color: colors.primary }]}>
            {formattedContent}
          </Text>
        );
      case 'heading3':
        return (
          <Text key={index} style={[styles.heading3, { color: colors.primary }]}>
            {formattedContent}
          </Text>
        );
      case 'heading4':
        return (
          <Text key={index} style={[styles.heading4, { color: colors.text }]}>
            {formattedContent}
          </Text>
        );
      case 'listItem':
        return (
          <View key={index} style={styles.listItemContainer}>
            <Text style={[styles.listBullet, { color: colors.primary }]}>•</Text>
            <Text style={[styles.listItemText, { color: colors.text }]}>
              {formattedContent}
            </Text>
          </View>
        );
      case 'numberedListItem':
        return (
          <View key={index} style={styles.listItemContainer}>
            <Text style={[styles.numberBullet, { color: colors.primary }]}>
              {index + 1}.
            </Text>
            <Text style={[styles.listItemText, { color: colors.text }]}>
              {formattedContent}
            </Text>
          </View>
        );
      case 'codeBlock':
        return (
          <View key={index} style={[
            styles.codeBlockContainer, 
            { 
              backgroundColor: isDarkMode ? '#1a1a1a' : '#f6f8fa',
              borderColor: isDarkMode ? '#333' : '#e1e4e8'
            }
          ]}>
            {element.language && (
              <Text style={[styles.codeLanguage, { color: colors.textSecondary }]}>
                {element.language}
              </Text>
            )}
            <Text style={[
              styles.codeBlock, 
              { 
                color: isDarkMode ? '#e1e4e8' : '#24292e',
                backgroundColor: 'transparent'
              }
            ]}>
              {element.content}
            </Text>
          </View>
        );
      case 'callout':
        const calloutStyles = getCalloutStyles(element.variant, colors, isDarkMode);
        return (
          <View key={index} style={[styles.calloutContainer, calloutStyles.container]}>
            <Text style={[styles.calloutIcon, { color: calloutStyles.iconColor }]}>
              {getCalloutIcon(element.variant)}
            </Text>
            <Text style={[styles.calloutText, { color: calloutStyles.textColor }]}>
              {formattedContent}
            </Text>
          </View>
        );
      case 'blockquote':
        return (
          <View key={index} style={[
            styles.blockquoteContainer,
            { 
              borderLeftColor: colors.primary,
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
            }
          ]}>
            <Text style={[styles.blockquoteText, { color: colors.textSecondary }]}>
              {formattedContent}
            </Text>
          </View>
        );
      case 'divider':
        return (
          <View key={index} style={[styles.divider, { backgroundColor: colors.border }]} />
        );
      case 'paragraph':
        return (
          <Text key={index} style={[styles.paragraph, { color: colors.text }]}>
            {formattedContent}
          </Text>
        );
      case 'spacing':
        return <View key={index} style={styles.spacing} />;
      default:
        return (
          <Text key={index} style={[styles.paragraph, { color: colors.text }]}>
            {formattedContent}
          </Text>
        );
    }
  };

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {elements.map(renderElement)}
      </View>
    </ScrollView>
  );
}

// Helper functions for callouts
const getCalloutIcon = (variant: string) => {
  switch (variant) {
    case 'info': return 'ℹ️';
    case 'warning': return '⚠️';
    case 'success': return '✅';
    case 'note': return '📝';
    case 'tip': return '💡';
    default: return 'ℹ️';
  }
};

const getCalloutStyles = (variant: string, colors: any, isDarkMode: boolean) => {
  const baseStyles = {
    info: {
      container: { backgroundColor: isDarkMode ? 'rgba(54, 163, 247, 0.1)' : 'rgba(54, 163, 247, 0.05)', borderLeftColor: '#36a3f7' },
      iconColor: '#36a3f7',
      textColor: colors.text
    },
    warning: {
      container: { backgroundColor: isDarkMode ? 'rgba(255, 159, 10, 0.1)' : 'rgba(255, 159, 10, 0.05)', borderLeftColor: '#ff9f0a' },
      iconColor: '#ff9f0a',
      textColor: colors.text
    },
    success: {
      container: { backgroundColor: isDarkMode ? 'rgba(52, 199, 89, 0.1)' : 'rgba(52, 199, 89, 0.05)', borderLeftColor: '#34c759' },
      iconColor: '#34c759',
      textColor: colors.text
    },
    note: {
      container: { backgroundColor: isDarkMode ? 'rgba(162, 132, 94, 0.1)' : 'rgba(162, 132, 94, 0.05)', borderLeftColor: '#a2845e' },
      iconColor: '#a2845e',
      textColor: colors.text
    },
    tip: {
      container: { backgroundColor: isDarkMode ? 'rgba(255, 214, 10, 0.1)' : 'rgba(255, 214, 10, 0.05)', borderLeftColor: '#ffd60a' },
      iconColor: '#ffd60a',
      textColor: colors.text
    }
  };
  
  return baseStyles[variant] || baseStyles.info;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  heading1: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 28,
  },
  heading4: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 6,
    lineHeight: 26,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 16,
    fontWeight: '400',
  },
  listItemContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  listBullet: {
    fontSize: 18,
    lineHeight: 26,
    marginRight: 12,
    fontWeight: '600',
  },
  numberBullet: {
    fontSize: 16,
    lineHeight: 26,
    marginRight: 12,
    fontWeight: '600',
    minWidth: 24,
  },
  listItemText: {
    fontSize: 16,
    lineHeight: 26,
    flex: 1,
    fontWeight: '400',
  },
  codeBlockContainer: {
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 12,
    overflow: 'hidden',
  },
  codeLanguage: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeBlock: {
    fontFamily: 'Courier New',
    fontSize: 14,
    lineHeight: 20,
    padding: 16,
    paddingTop: 8,
  },
  calloutContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginVertical: 12,
    alignItems: 'flex-start',
  },
  calloutIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  calloutText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
    fontWeight: '400',
  },
  blockquoteContainer: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    paddingVertical: 8,
    marginVertical: 12,
    borderRadius: 4,
  },
  blockquoteText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  spacing: {
    height: 12,
  },
});

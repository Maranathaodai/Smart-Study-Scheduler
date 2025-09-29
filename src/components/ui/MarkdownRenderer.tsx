import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../contexts/ThemeContext';

interface MarkdownRendererProps {
  content: string;
  style?: any;
}

export function MarkdownRenderer({ content, style }: MarkdownRendererProps) {
  const { colors, isDarkMode } = useTheme();

  const markdownStyles = {
    body: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'System',
    },
    heading1: {
      color: colors.primary,
      fontSize: 24,
      fontWeight: 'bold' as const,
      marginTop: 20,
      marginBottom: 10,
      lineHeight: 32,
    },
    heading2: {
      color: colors.primary,
      fontSize: 20,
      fontWeight: 'bold' as const,
      marginTop: 16,
      marginBottom: 8,
      lineHeight: 28,
    },
    heading3: {
      color: colors.primary,
      fontSize: 18,
      fontWeight: '600' as const,
      marginTop: 12,
      marginBottom: 6,
      lineHeight: 26,
    },
    paragraph: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 12,
    },
    strong: {
      color: colors.text,
      fontWeight: 'bold' as const,
    },
    em: {
      color: colors.text,
      fontStyle: 'italic' as const,
    },
    link: {
      color: colors.primary,
      textDecorationLine: 'underline' as const,
    },
    blockquote: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      paddingLeft: 16,
      paddingVertical: 8,
      marginVertical: 8,
      borderRadius: 4,
    },
    code_inline: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      color: colors.primary,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 3,
      fontSize: 14,
      fontFamily: 'monospace',
    },
    code_block: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      color: colors.text,
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
      fontSize: 14,
      fontFamily: 'monospace',
    },
    list_item: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 4,
    },
    bullet_list: {
      marginVertical: 8,
    },
    ordered_list: {
      marginVertical: 8,
    },
    hr: {
      backgroundColor: colors.border,
      height: 1,
      marginVertical: 16,
    },
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      marginVertical: 8,
    },
    thead: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    tbody: {},
    th: {
      color: colors.text,
      fontWeight: 'bold' as const,
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    td: {
      color: colors.text,
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
  };

  return (
    <View style={[styles.container, style]}>
      <Markdown style={markdownStyles}>
        {content}
      </Markdown>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

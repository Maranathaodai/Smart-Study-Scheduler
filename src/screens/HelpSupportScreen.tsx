import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function HelpSupportScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how you\'d like to get help:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email', onPress: () => Linking.openURL('mailto:maranathaokeleyodai@gmail.com') },
        { text: 'Live Chat', onPress: () => Alert.alert('Live Chat', 'Connecting you to our support team...') },
      ]
    );
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate the App',
      'Would you like to rate us on the App Store?',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Rate', onPress: () => Alert.alert('Thank you!', 'Your rating helps us improve the app.') },
      ]
    );
  };

  const handleSendFeedback = () => {
    Alert.alert(
      'Send Feedback',
      'Your feedback helps us make the app better. What would you like to tell us?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => Alert.alert('Thank you!', 'Your feedback has been sent.') },
      ]
    );
  };

  const faqCategories = [
    {
      id: 'all',
      title: 'All',
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
    },
    {
      id: 'courses',
      title: 'Courses',
    },
    {
      id: 'scheduling',
      title: 'Scheduling',
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
    },
  ];

  const faqItems = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I add my first course?',
      answer: 'Tap the "Add Course" button on the Home screen, then follow the setup wizard to upload your materials and set your study goals.',
    },
    {
      id: 2,
      category: 'courses',
      question: 'What file formats are supported?',
      answer: 'We support PDF, PowerPoint (PPTX), Word documents (DOCX), and image files (JPG, PNG). The app will automatically process your files and create study sessions.',
    },
    {
      id: 3,
      category: 'scheduling',
      question: 'How does the smart scheduling work?',
      answer: 'Our AI analyzes your course content and creates a personalised study schedule based on your available time, learning pace, and difficulty level of the material.',
    },
    {
      id: 4,
      category: 'scheduling',
      question: 'Can I adjust my study schedule?',
      answer: 'Yes! You can modify any study session by tapping on it in the Calendar view. You can reschedule, change duration, or skip sessions as needed.',
    },
    {
      id: 5,
      category: 'troubleshooting',
      question: 'The app is running slowly. What should I do?',
      answer: 'Try closing and reopening the app, or restart your device. If the issue persists, contact our support team for assistance.',
    },
    {
      id: 6,
      category: 'courses',
      question: 'How do I delete a course?',
      answer: 'Go to the Courses tab, find the course you want to delete, swipe left on it, and tap the delete button. This action cannot be undone.',
    },
    {
      id: 7,
      category: 'getting-started',
      question: 'How do I set up notifications?',
      answer: 'Go to Profile > Notifications to customise your study reminders, goal updates, and other notifications.',
    },
    {
      id: 8,
      category: 'troubleshooting',
      question: 'I can\'t upload my files. What\'s wrong?',
      answer: 'Make sure your files are in a supported format and under 50MB. Check your internet connection and try again. If the problem continues, contact support.',
    },
  ];

  const filteredFaqs = selectedCategory === 'all' 
    ? faqItems 
    : faqItems.filter(item => item.category === selectedCategory);

  const searchResults = searchQuery 
    ? filteredFaqs.filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredFaqs;

  const quickActions = [
    {
      title: 'Contact Support',
      description: 'Get help from our team',
      icon: 'chatbubble-outline',
      action: handleContactSupport,
    },
    {
      title: 'Send Feedback',
      description: 'Share your thoughts',
      icon: 'mail-outline',
      action: handleSendFeedback,
    },
    {
      title: 'Rate the App',
      description: 'Help others discover us',
      icon: 'star-outline',
      action: handleRateApp,
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Search */}
        <Card style={styles.card}>
          <CardContent>
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionItem,
                  index < quickActions.length - 1 && styles.actionItemBorder,
                ]}
                onPress={action.action}
              >
                <View style={styles.actionContent}>
                  <Ionicons name={action.icon as any} size={24} color="#007AFF" />
                  <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionDescription}>{action.description}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>
            ))}
          </CardContent>
        </Card>

        {/* FAQ Categories */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {faqCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.categoryTextActive,
                    ]}
                  >
                    {category.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </CardContent>
        </Card>

        {/* FAQ Items */}
        <Card style={styles.card}>
          <CardContent>
            {searchResults.length > 0 ? (
              searchResults.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.faqItem,
                    index < searchResults.length - 1 && styles.faqItemBorder,
                  ]}
                >
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                </View>
              ))
            ) : (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={48} color="#8E8E93" />
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubtext}>Try a different search term or browse categories</Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Contact Info */}
        <View style={styles.contactCard}>
          <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
          <Text style={styles.contactText}>
            Can't find what you're looking for? Our support team is here to help 24/7.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
  },
  placeholder: {
    width: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 0,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  actionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    marginLeft: 12,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  faqItem: {
    paddingVertical: 16,
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  faqQuestion: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsText: {
    fontSize: 18,
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  contactText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

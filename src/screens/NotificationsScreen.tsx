import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function NotificationsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState({
    studyReminders: true,
    dailyGoals: true,
    weeklyReports: true,
    courseUpdates: true,
    achievementAlerts: true,
    breakReminders: true,
    emailDigest: false,
    pushNotifications: true,
  });

  const handleToggle = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleSaveSettings = () => {
    Alert.alert('Success', 'Notification settings saved!');
  };

  const handleTestNotification = () => {
    Alert.alert(
      'Test Notification',
      'This is how your notifications will appear. You can customise the timing and content in your device settings.',
      [{ text: 'Got it!' }]
    );
  };

  const notificationGroups = [
    {
      title: 'Study Reminders',
      items: [
        {
          key: 'studyReminders',
          title: 'Daily Study Reminders',
          description: 'Get reminded to start your daily study sessions',
          icon: 'book-outline',
        },
        {
          key: 'breakReminders',
          title: 'Break Reminders',
          description: 'Take breaks between study sessions',
          icon: 'time-outline',
        },
      ],
    },
    {
      title: 'Progress & Goals',
      items: [
        {
          key: 'dailyGoals',
          title: 'Daily Goal Updates',
          description: 'Track your daily study progress',
          icon: 'radio-button-on-outline',
        },
        {
          key: 'weeklyReports',
          title: 'Weekly Progress Reports',
          description: 'Summary of your weekly achievements',
          icon: 'bar-chart-outline',
        },
        {
          key: 'achievementAlerts',
          title: 'Achievement Alerts',
          description: 'Celebrate your milestones and streaks',
          icon: 'trophy-outline',
        },
      ],
    },
    {
      title: 'Course Updates',
      items: [
        {
          key: 'courseUpdates',
          title: 'Course Notifications',
          description: 'Updates about your courses and materials',
          icon: 'school-outline',
        },
      ],
    },
    {
      title: 'Communication',
      items: [
        {
          key: 'emailDigest',
          title: 'Email Digest',
          description: 'Weekly summary via email',
          icon: 'mail-outline',
        },
        {
          key: 'pushNotifications',
          title: 'Push Notifications',
          description: 'Enable all push notifications',
          icon: 'phone-portrait-outline',
        },
      ],
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Quick Actions */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleTestNotification}
            >
              <View style={styles.actionContent}>
                <Ionicons name="notifications-outline" size={24} color="#007AFF" />
                <Text style={styles.actionTitle}>Test Notification</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        {notificationGroups.map((group, groupIndex) => (
          <Card key={groupIndex} style={styles.card}>
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {group.items.map((item, itemIndex) => (
                <View
                  key={item.key}
                  style={[
                    styles.settingItem,
                    itemIndex < group.items.length - 1 && styles.settingItemBorder,
                  ]}
                >
                  <View style={styles.settingInfo}>
                    <Ionicons name={item.icon as any} size={24} color="#000000" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      <Text style={styles.settingDescription}>{item.description}</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifications[item.key as keyof typeof notifications]}
                    onValueChange={() => handleToggle(item.key)}
                    trackColor={{ false: '#D1D1D6', true: '#007AFF' }}
                    thumbColor={notifications[item.key as keyof typeof notifications] ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Save Button */}
        <Button
          title="Save Settings"
          onPress={handleSaveSettings}
          style={styles.saveButton}
        />

        {/* Help Text */}
        <View style={styles.helpCard}>
          <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
          <Text style={styles.helpText}>
            You can also manage notifications in your device settings for more granular control.
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
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  saveButton: {
    marginTop: 8,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  helpText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

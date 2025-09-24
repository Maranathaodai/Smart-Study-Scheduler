import React from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function AboutScreen({ navigation }: any) {
  const { colors } = useTheme();
  const handleOpenWebsite = () => {
    Linking.openURL('https://smartstudyscheduler.com');
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://smartstudyscheduler.com/privacy');
  };

  const handleOpenTermsOfService = () => {
    Linking.openURL('https://smartstudyscheduler.com/terms');
  };

  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com/smartstudyscheduler');
  };

  const handleOpenTwitter = () => {
    Linking.openURL('https://twitter.com/smartstudyscheduler');
  };

  const handleCheckForUpdates = () => {
    Alert.alert(
      'Check for Updates',
      'You\'re using the latest version of Smart Study Scheduler!',
      [{ text: 'Great!' }]
    );
  };

  const appInfo = {
    name: 'Smart Study Scheduler',
    version: '1.0.0',
    build: '2024.1.0',
    releaseDate: 'January 2024',
  };

  const teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'Product Manager',
      description: 'Passionate about education technology',
    },
    {
      name: 'Michael Chen',
      role: 'Lead Developer',
      description: 'Full-stack developer with 8+ years experience',
    },
    {
      name: 'Emily Rodriguez',
      role: 'UX Designer',
      description: 'Creating intuitive learning experiences',
    },
    {
      name: 'David Kim',
      role: 'Data Scientist',
      description: 'AI and machine learning specialist',
    },
  ];

  const features = [
    'AI-powered study scheduling',
    'Smart content analysis',
    'Progress tracking and analytics',
    'Cross-platform synchronisation',
    'Offline study mode',
    'Customisable study plans',
  ];

  const legalItems = [
    {
      title: 'Privacy Policy',
      description: 'How we protect your data',
      icon: 'shield-outline',
      action: handleOpenPrivacyPolicy,
    },
    {
      title: 'Terms of Service',
      description: 'App usage terms and conditions',
      icon: 'document-text-outline',
      action: handleOpenTermsOfService,
    },
    {
      title: 'Open Source Licenses',
      description: 'Third-party libraries and licenses',
      icon: 'code-outline',
      action: () => Alert.alert('Open Source', 'Built with React Native, Expo, and other open source technologies.'),
    },
  ];

  const socialLinks = [
    {
      title: 'Website',
      description: 'Visit our official website',
      icon: 'globe-outline',
      action: handleOpenWebsite,
    },
    {
      title: 'GitHub',
      description: 'View source code and contribute',
      icon: 'logo-github',
      action: handleOpenGitHub,
    },
    {
      title: 'Twitter',
      description: 'Follow us for updates',
      icon: 'logo-twitter',
      action: handleOpenTwitter,
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
        <Text style={[styles.title, { color: colors.text }]}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* App Info */}
        <Card style={styles.card}>
          <CardContent style={styles.appInfoCard}>
            <View style={styles.appIcon}>
              <Ionicons name="book" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>{appInfo.name}</Text>
            <Text style={styles.appVersion}>Version {appInfo.version}</Text>
            <Text style={styles.appBuild}>Build {appInfo.build}</Text>
            <Text style={styles.appRelease}>Released {appInfo.releaseDate}</Text>
          </CardContent>
        </Card>

        {/* App Description */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>About This App</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.description}>
              Smart Study Scheduler is an AI-powered study companion that helps students 
              organise their learning materials and create personalised study schedules. 
              Our intelligent system analyses your course content and generates optimal 
              study plans tailored to your learning style and available time.
            </Text>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Team */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Meet the Team</CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers.map((member, index) => (
              <View key={index} style={styles.teamMember}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitials}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                  <Text style={styles.memberDescription}>{member.description}</Text>
                </View>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Update Check */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>App Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <TouchableOpacity
              style={styles.updateItem}
              onPress={handleCheckForUpdates}
            >
              <View style={styles.updateContent}>
                <Ionicons name="refresh-outline" size={24} color="#007AFF" />
                <View style={styles.updateText}>
                  <Text style={styles.updateTitle}>Check for Updates</Text>
                  <Text style={styles.updateDescription}>Make sure you have the latest version</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Connect With Us</CardTitle>
          </CardHeader>
          <CardContent>
            {socialLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.linkItem,
                  index < socialLinks.length - 1 && styles.linkItemBorder,
                ]}
                onPress={link.action}
              >
                <View style={styles.linkContent}>
                  <Ionicons name={link.icon as any} size={24} color="#007AFF" />
                  <View style={styles.linkText}>
                    <Text style={styles.linkTitle}>{link.title}</Text>
                    <Text style={styles.linkDescription}>{link.description}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>
            ))}
          </CardContent>
        </Card>

        {/* Legal */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Legal</CardTitle>
          </CardHeader>
          <CardContent>
            {legalItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.legalItem,
                  index < legalItems.length - 1 && styles.legalItemBorder,
                ]}
                onPress={item.action}
              >
                <View style={styles.legalContent}>
                  <Ionicons name={item.icon as any} size={24} color="#000000" />
                  <View style={styles.legalText}>
                    <Text style={styles.legalTitle}>{item.title}</Text>
                    <Text style={styles.legalDescription}>{item.description}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>
            ))}
          </CardContent>
        </Card>

        {/* Copyright */}
        <View style={styles.copyrightCard}>
          <Text style={styles.copyrightText}>
            © 2024 Smart Study Scheduler. All rights reserved.
          </Text>
          <Text style={styles.copyrightSubtext}>
            Made with ❤️ for students everywhere
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
  appInfoCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 2,
  },
  appBuild: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  appRelease: {
    fontSize: 14,
    color: '#8E8E93',
  },
  description: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  memberDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  updateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  updateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  updateText: {
    marginLeft: 12,
    flex: 1,
  },
  updateTitle: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 2,
  },
  updateDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  linkItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkText: {
    marginLeft: 12,
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 2,
  },
  linkDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  legalItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  legalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legalText: {
    marginLeft: 12,
    flex: 1,
  },
  legalTitle: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 2,
  },
  legalDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  copyrightCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  copyrightText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  copyrightSubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
});

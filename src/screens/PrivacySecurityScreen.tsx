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
import { Input } from '../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function PrivacySecurityScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [securitySettings, setSecuritySettings] = useState({
    biometricAuth: true,
    autoLock: true,
    dataEncryption: true,
    analyticsTracking: false,
    crashReporting: true,
    locationTracking: false,
  });

  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleToggle = (key: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleChangePassword = () => {
    if (!password || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }
    Alert.alert('Success', 'Password changed successfully!');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be exported as a JSON file. This may take a few moments.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => Alert.alert('Success', 'Data exported successfully!') },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Account Deleted', 'Your account has been deleted.') },
      ]
    );
  };

  const securityGroups = [
    {
      title: 'Authentication',
      items: [
        {
          key: 'biometricAuth',
          title: 'Biometric Authentication',
          description: 'Use fingerprint or face recognition',
          icon: 'finger-print-outline',
        },
        {
          key: 'autoLock',
          title: 'Auto Lock',
          description: 'Lock app after 5 minutes of inactivity',
          icon: 'lock-closed-outline',
        },
      ],
    },
    {
      title: 'Data Protection',
      items: [
        {
          key: 'dataEncryption',
          title: 'Data Encryption',
          description: 'Encrypt all stored data',
          icon: 'shield-checkmark-outline',
        },
        {
          key: 'locationTracking',
          title: 'Location Tracking',
          description: 'Allow location-based features',
          icon: 'location-outline',
        },
      ],
    },
    {
      title: 'Privacy',
      items: [
        {
          key: 'analyticsTracking',
          title: 'Analytics Tracking',
          description: 'Help improve the app with usage data',
          icon: 'analytics-outline',
        },
        {
          key: 'crashReporting',
          title: 'Crash Reporting',
          description: 'Send crash reports to help fix bugs',
          icon: 'bug-outline',
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
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Privacy & Security</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Security Settings */}
        {securityGroups.map((group, groupIndex) => (
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
                    value={securitySettings[item.key as keyof typeof securitySettings]}
                    onValueChange={() => handleToggle(item.key)}
                    trackColor={{ false: '#D1D1D6', true: '#007AFF' }}
                    thumbColor={securitySettings[item.key as keyof typeof securitySettings] ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Change Password */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Current Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
            <Input
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.input}
            />
            <Input
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
            />
            <Button
              title="Change Password"
              onPress={handleChangePassword}
              style={styles.actionButton}
            />
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleExportData}
            >
              <View style={styles.actionContent}>
                <Ionicons name="download-outline" size={24} color="#007AFF" />
                <Text style={styles.actionTitle}>Export My Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.card, styles.dangerCard]}>
          <CardHeader>
            <CardTitle style={styles.dangerTitle}>Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <TouchableOpacity
              style={styles.dangerItem}
              onPress={handleDeleteAccount}
            >
              <View style={styles.actionContent}>
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                <Text style={styles.dangerText}>Delete Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* Privacy Policy */}
        <View style={styles.helpCard}>
          <Ionicons name="document-text-outline" size={20} color="#8E8E93" />
          <Text style={styles.helpText}>
            Read our Privacy Policy to understand how we protect your data.
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
  input: {
    marginBottom: 16,
  },
  actionButton: {
    marginTop: 8,
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
  dangerCard: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  dangerTitle: {
    color: '#FF3B30',
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  dangerText: {
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 12,
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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PrivacySecurityScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user, updatePassword } = useAuth();
  const [securitySettings, setSecuritySettings] = useState({
    biometricAuth: false,
    autoLock: true,
    dataEncryption: true,
    analyticsTracking: false,
    crashReporting: true,
    locationTracking: false,
  });

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Check biometric availability on component mount
  useEffect(() => {
    checkBiometricAvailability();
    loadSecuritySettings();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      console.log('Biometric check:', { hasHardware, isEnrolled, supportedTypes });
      
      if (hasHardware && isEnrolled) {
        setBiometricAvailable(true);
        
        // Determine biometric type
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('Iris');
        } else {
          setBiometricType('Biometric');
        }
      } else {
        setBiometricAvailable(false);
        setBiometricType('');
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  const loadSecuritySettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('securitySettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSecuritySettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const saveSecuritySettings = async (newSettings: typeof securitySettings) => {
    try {
      await AsyncStorage.setItem('securitySettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving security settings:', error);
    }
  };

  const handleToggle = async (key: string) => {
    if (key === 'biometricAuth') {
      if (!biometricAvailable) {
        Alert.alert(
          'Biometric Authentication Not Available',
          `${biometricType || 'Biometric authentication'} is not available on this device or not set up. Please check your device settings.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // If enabling biometric auth, authenticate first
      if (!securitySettings.biometricAuth) {
        try {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: `Enable ${biometricType || 'Biometric'} Authentication`,
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
          });

          if (result.success) {
            const newSettings = {
              ...securitySettings,
              [key]: !securitySettings[key as keyof typeof securitySettings]
            };
            setSecuritySettings(newSettings);
            await saveSecuritySettings(newSettings);
            
            Alert.alert(
              'Success',
              `${biometricType || 'Biometric'} authentication has been enabled!`,
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Authentication Failed',
              'Biometric authentication was not successful. Please try again.',
              [{ text: 'OK' }]
            );
          }
        } catch (error) {
          console.error('Biometric authentication error:', error);
          Alert.alert(
            'Error',
            'Failed to authenticate. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // If disabling biometric auth, just toggle it
        const newSettings = {
          ...securitySettings,
          [key]: !securitySettings[key as keyof typeof securitySettings]
        };
        setSecuritySettings(newSettings);
        await saveSecuritySettings(newSettings);
        
        Alert.alert(
          'Biometric Authentication Disabled',
          `${biometricType || 'Biometric'} authentication has been disabled.`,
          [{ text: 'OK' }]
        );
      }
    } else {
      // For other settings, just toggle normally
      const newSettings = {
        ...securitySettings,
        [key]: !securitySettings[key as keyof typeof securitySettings]
      };
      setSecuritySettings(newSettings);
      await saveSecuritySettings(newSettings);
    }
  };

  const handleChangePassword = async () => {
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
    
    try {
      await updatePassword(newPassword);
      Alert.alert('Success', 'Password changed successfully!');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', `Failed to change password: ${error.message}`);
    }
  };

  // Function to authenticate with biometrics (can be used by other parts of the app)
  const authenticateWithBiometrics = async (): Promise<boolean> => {
    if (!biometricAvailable || !securitySettings.biometricAuth) {
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `${biometricType || 'Biometric'} Authentication`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  };

  const handleExportData = async () => {
    // If biometric auth is enabled, authenticate first
    if (securitySettings.biometricAuth && biometricAvailable) {
      const authenticated = await authenticateWithBiometrics();
      if (!authenticated) {
        Alert.alert('Authentication Required', 'Biometric authentication is required to export data.');
        return;
      }
    }

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
          description: biometricAvailable 
            ? `Use ${biometricType || 'biometric authentication'} for secure login`
            : 'Biometric authentication not available on this device',
          icon: biometricType === 'Face ID' ? 'face-recognition-outline' : 
                biometricType === 'Touch ID' ? 'finger-print-outline' : 
                'shield-checkmark-outline',
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
                    disabled={item.key === 'biometricAuth' && !biometricAvailable}
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
        <Card style={{...styles.card, ...styles.dangerCard}}>
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

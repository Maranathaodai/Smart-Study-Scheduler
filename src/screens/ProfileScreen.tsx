import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { dummyUser, dummyCourses, dummySessions } from '../lib/dummy-data';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';

export default function ProfileScreen({ navigation }: any) {
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  const { user, updateUser, resetUser, clearStoredUserData } = useUser();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user.bio || '');

  // Simple achievement checks derived from dummy data
  const completedSessionsCount = dummySessions.filter(s => s.completed).length;
  const completedSlidesSum = dummyCourses.reduce((acc, c) => acc + c.completedSlides, 0);
  const hasFirstSteps = completedSessionsCount >= 1;
  const hasStreakMaster = completedSessionsCount >= 7; // placeholder threshold
  const hasDedicatedLearner = completedSlidesSum >= 50;

  console.log('ProfileScreen user data:', user);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await resetUser();
              navigation.reset({ index: 0, routes: [{ name: 'Auth' as never }] });
            } catch (e) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleBioEdit = () => {
    setIsEditingBio(true);
    setBioText(user.bio || '');
  };

  const handleBioSave = () => {
    updateUser({ bio: bioText });
    setIsEditingBio(false);
  };

  const handleBioCancel = () => {
    setBioText(user.bio || '');
    setIsEditingBio(false);
  };

  const menuItems = [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      action: () => navigation.navigate('Notifications' as never),
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: 'shield-outline',
      action: () => navigation.navigate('PrivacySecurity' as never),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      action: () => navigation.navigate('HelpSupport' as never),
    },
    {
      id: 'about',
      title: 'About',
      icon: 'information-circle-outline',
      action: () => navigation.navigate('About' as never),
    },
  ];

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 100,
    },
    card: {
      marginBottom: 16,
      backgroundColor: colors.card,
    },
    profileCard: {
      marginBottom: 16,
      backgroundColor: colors.card,
    },
    profileContent: {
      alignItems: 'center',
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    editButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editForm: {
      width: '100%',
    },
    editInput: {
      marginBottom: 16,
    },
    editButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    profileInfo: {
      alignItems: 'center',
    },
    profileName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    achievementsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
    },
    achievementBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    preferenceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    preferenceInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    preferenceTitle: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
    },
    menuItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuItemTitle: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    logoutButton: {
      marginTop: 24,
      borderColor: colors.error,
    },
    bioHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bioText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
    bioInput: {
      marginBottom: 16,
    },
    bioButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    bioButton: {
      flex: 0.48,
    },
  });

  return (
    <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Profile</Text>
      </View>

      <View style={dynamicStyles.content}>
        {/* Profile Header */}
        <Card style={dynamicStyles.profileCard}>
          <CardContent style={dynamicStyles.profileContent}>
            <View style={dynamicStyles.avatarContainer}>
              <View style={dynamicStyles.avatar}>
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={dynamicStyles.avatarImage} />
                ) : (
                  <Text style={dynamicStyles.avatarText}>
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={dynamicStyles.editButton}
                onPress={() => navigation.navigate('EditProfile' as never)}
              >
                <Ionicons name="create-outline" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={dynamicStyles.profileInfo}>
              <Text style={dynamicStyles.profileName}>{user.name}</Text>
              <Text style={dynamicStyles.profileEmail}>{user.email}</Text>
              <View style={dynamicStyles.achievementsRow}>
                <View style={dynamicStyles.achievementBadge}>
                  <Ionicons name="trophy" size={16} color={hasFirstSteps ? '#FFD700' : colors.textSecondary} />
                </View>
                <View style={dynamicStyles.achievementBadge}>
                  <Ionicons name="flame" size={16} color={hasStreakMaster ? '#FF6B35' : colors.textSecondary} />
                </View>
                <View style={dynamicStyles.achievementBadge}>
                  <Ionicons name="star" size={16} color={hasDedicatedLearner ? '#007AFF' : colors.textSecondary} />
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Bio Section */}
        <Card style={dynamicStyles.card}>
          <CardHeader>
            <View style={dynamicStyles.bioHeader}>
              <CardTitle>About</CardTitle>
              <TouchableOpacity onPress={handleBioEdit}>
                <Ionicons name="create-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </CardHeader>
          <CardContent>
            {isEditingBio ? (
              <View>
                <Input
                  value={bioText}
                  onChangeText={setBioText}
                  placeholder="Tell us about yourself..."
                  multiline
                  numberOfLines={3}
                  style={dynamicStyles.bioInput}
                />
                <View style={dynamicStyles.bioButtons}>
                  <Button
                    title="Cancel"
                    onPress={handleBioCancel}
                    variant="outline"
                    style={dynamicStyles.bioButton}
                  />
                  <Button
                    title="Save"
                    onPress={handleBioSave}
                    style={dynamicStyles.bioButton}
                  />
                </View>
              </View>
            ) : (
              <Text style={dynamicStyles.bioText}>
                {user.bio || 'No bio available. Tap the edit icon to add one.'}
              </Text>
            )}
          </CardContent>
        </Card>

        {/* Study Statistics */}
        <Card style={dynamicStyles.card}>
          <CardHeader>
            <CardTitle>Study Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={dynamicStyles.statsGrid}>
              <View style={dynamicStyles.statItem}>
                <Text style={dynamicStyles.statValue}>24</Text>
                <Text style={dynamicStyles.statLabel}>Days Streak</Text>
              </View>
              <View style={dynamicStyles.statItem}>
                <Text style={dynamicStyles.statValue}>156</Text>
                <Text style={dynamicStyles.statLabel}>Hours Studied</Text>
              </View>
              <View style={dynamicStyles.statItem}>
                <Text style={dynamicStyles.statValue}>2</Text>
                <Text style={dynamicStyles.statLabel}>Courses</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card style={dynamicStyles.card}>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={dynamicStyles.preferenceItem}>
              <View style={dynamicStyles.preferenceInfo}>
                <Ionicons name="moon-outline" size={24} color={colors.text} />
                <Text style={dynamicStyles.preferenceTitle}>Dark Mode</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#D1D1D6', true: colors.primary }}
                thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
            
            <View style={dynamicStyles.preferenceItem}>
              <View style={dynamicStyles.preferenceInfo}>
                <Ionicons name="notifications-outline" size={24} color={colors.text} />
                <Text style={dynamicStyles.preferenceTitle}>Push Notifications</Text>
              </View>
              <Switch
                value={user.preferences.notifications}
                onValueChange={(value) =>
                  updateUser({
                    preferences: { ...user.preferences, notifications: value },
                  })
                }
                trackColor={{ false: '#D1D1D6', true: colors.primary }}
                thumbColor={user.preferences.notifications ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card style={dynamicStyles.card}>
          <CardContent>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  dynamicStyles.menuItem,
                  index < menuItems.length - 1 && dynamicStyles.menuItemBorder,
                ]}
                onPress={item.action}
              >
                <View style={dynamicStyles.menuItemContent}>
                  <Ionicons name={item.icon as any} size={24} color={colors.text} />
                  <Text style={dynamicStyles.menuItemTitle}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </CardContent>
        </Card>

        {/* Clear Data Button - Temporary for debugging */}
        <Button
          title="Refresh Profile Data"
          onPress={clearStoredUserData}
          variant="outline"
          style={[dynamicStyles.logoutButton, { marginTop: 8 }]}
        />

        {/* Logout Button */}
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={dynamicStyles.logoutButton}
        />
      </View>
    </ScrollView>
  );
}


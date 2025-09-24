import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { dummyUser } from '../lib/dummy-data';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user, updateUser } = useUser();
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    bio: user.bio || '',
    university: user.university || '',
    major: user.major || '',
    year: user.year || '',
    avatar: user.avatar || '',
  });

  const [isEditing, setIsEditing] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState({
    name: user.name,
    email: user.email,
    bio: user.bio || '',
    university: user.university || '',
    major: user.major || '',
    year: user.year || '',
    avatar: user.avatar || '',
  });

  const handleSave = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    updateUser(formData);
    setOriginalData({ ...formData });
    setHasUnsavedChanges(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    setFormData({ ...originalData });
    setHasUnsavedChanges(false);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setOriginalData({ ...formData });
    setIsEditing(true);
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard all unsaved changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive', 
          onPress: () => {
            setFormData({ ...originalData });
            setHasUnsavedChanges(false);
          }
        },
      ]
    );
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select photos!');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, avatar: result.assets[0].uri }));
      setHasUnsavedChanges(true);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, avatar: result.assets[0].uri }));
      setHasUnsavedChanges(true);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Photo',
      'Choose how you\'d like to update your profile photo:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
      ]
    );
  };

  const handleDeletePhoto = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            setFormData(prev => ({ ...prev, avatar: '' }));
            setHasUnsavedChanges(true);
          }
        },
      ]
    );
  };

  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'Postgraduate'];

  // Update form data when user data changes
  useEffect(() => {
    setFormData({
      name: user.name,
      email: user.email,
      bio: user.bio || '',
      university: user.university || '',
      major: user.major || '',
      year: user.year || '',
      avatar: user.avatar || '',
    });
    setOriginalData({
      name: user.name,
      email: user.email,
      bio: user.bio || '',
      university: user.university || '',
      major: user.major || '',
      year: user.year || '',
      avatar: user.avatar || '',
    });
  }, [user]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Profile Photo */}
        <Card style={styles.card}>
          <CardContent style={styles.photoSection}>
            <View style={styles.photoContainer}>
              <View style={styles.avatar}>
                {formData.avatar ? (
                  <Image source={{ uri: formData.avatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {formData.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={handleChangePhoto}
              >
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.photoActions}>
              <TouchableOpacity
                style={styles.photoActionButton}
                onPress={handleChangePhoto}
              >
                <Ionicons name="camera-outline" size={20} color="#007AFF" />
                <Text style={styles.photoActionText}>Change Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoActionButton}
                onPress={handleDeletePhoto}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={[styles.photoActionText, { color: '#FF3B30' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Full Name *"
              value={formData.name}
              onChangeText={(text) => handleFieldChange('name', text)}
              style={styles.input}
            />
            <Input
              label="Email Address *"
              value={formData.email}
              onChangeText={(text) => handleFieldChange('email', text)}
              style={styles.input}
            />
            <Input
              label="Bio"
              value={formData.bio}
              onChangeText={(text) => handleFieldChange('bio', text)}
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="University"
              value={formData.university}
              onChangeText={(text) => handleFieldChange('university', text)}
              placeholder="Enter your university name"
              style={styles.input}
            />
            <Input
              label="Major/Field of Study"
              value={formData.major}
              onChangeText={(text) => handleFieldChange('major', text)}
              placeholder="Enter your major or field of study"
              style={styles.input}
            />
            <View style={styles.yearContainer}>
              <Text style={styles.yearLabel}>Academic Year</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
                {yearOptions.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearOption,
                      formData.year === year && styles.yearOptionActive,
                    ]}
                    onPress={() => handleFieldChange('year', year)}
                  >
                    <Text
                      style={[
                        styles.yearOptionText,
                        formData.year === year && styles.yearOptionTextActive,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </CardContent>
        </Card>


        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Discard"
            onPress={handleDiscard}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title={hasUnsavedChanges ? "Save Changes" : "Save"}
            onPress={handleSave}
            style={styles.actionButton}
          />
        </View>

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <View style={styles.unsavedWarning}>
            <Ionicons name="warning-outline" size={20} color="#FF9500" />
            <Text style={styles.unsavedText}>You have unsaved changes</Text>
          </View>
        )}

        {/* Help Text */}
        <View style={styles.helpCard}>
          <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
          <Text style={styles.helpText}>
            Your profile information helps us personalise your study experience and provide better recommendations.
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 16,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  photoActionText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  input: {
    marginBottom: 16,
  },
  yearContainer: {
    marginTop: 8,
  },
  yearLabel: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 12,
    fontWeight: '500',
  },
  yearScroll: {
    marginBottom: 16,
  },
  yearOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  yearOptionActive: {
    backgroundColor: '#007AFF',
  },
  yearOptionText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  yearOptionTextActive: {
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  saveButtonHighlight: {
    backgroundColor: '#007AFF',
  },
  unsavedWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  unsavedText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    fontWeight: '500',
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

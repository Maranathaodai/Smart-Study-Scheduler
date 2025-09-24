import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, differenceInDays, addDays } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../contexts/ThemeContext';

export default function AddCourseScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [courseName, setCourseName] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalSlides, setTotalSlides] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [studySessions, setStudySessions] = useState([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  const categories = [
    'Mathematics',
    'Computer Science',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Literature',
    'Other',
  ];

  const generateSmartSchedule = () => {
    if (!totalSlides || !startDate || !endDate) {
      Alert.alert('Error', 'Please fill in all fields including total slides and dates');
      return;
    }

    const slides = parseInt(totalSlides);
    const totalDays = differenceInDays(endDate, startDate);
    
    if (totalDays <= 0) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    // Smart scheduling algorithm
    const sessions = [];
    const slidesPerSession = Math.ceil(slides / totalDays);
    const maxSlidesPerSession = Math.min(slidesPerSession + 2, 15); // Cap at 15 slides per session
    const minSlidesPerSession = Math.max(slidesPerSession - 2, 3); // Minimum 3 slides per session

    let remainingSlides = slides;
    let currentDate = new Date(startDate);

    while (remainingSlides > 0 && currentDate <= endDate) {
      const slidesForThisSession = Math.min(
        remainingSlides,
        Math.floor(Math.random() * (maxSlidesPerSession - minSlidesPerSession + 1)) + minSlidesPerSession
      );

      sessions.push({
        id: sessions.length + 1,
        date: new Date(currentDate),
        slides: slidesForThisSession,
        completed: false,
        completedSlides: 0,
      });

      remainingSlides -= slidesForThisSession;
      currentDate = addDays(currentDate, 1);
    }

    setStudySessions(sessions);
    setShowSchedule(true);
    
    // Navigate to study schedule screen
    navigation.navigate('StudySchedule', {
      course: { name: courseName, category },
      studySessions: sessions
    });
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newFiles = result.assets.map(file => ({
          id: Date.now() + Math.random(),
          name: file.name,
          type: file.mimeType || 'unknown',
          size: file.size || 0,
          uri: file.uri,
          uploadedAt: new Date(),
        }));

        setUploadedFiles(prev => [...prev, ...newFiles]);
        Alert.alert('Success', `${newFiles.length} file(s) uploaded successfully!`);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const shiftSession = (sessionId, direction) => {
    setStudySessions(prev => {
      const sessions = [...prev];
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) return prev;
      
      const session = sessions[sessionIndex];
      const newDate = new Date(session.date);
      
      if (direction === 'forward') {
        newDate.setDate(newDate.getDate() + 1);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
      
      // Check if the new date is within the allowed range
      if (newDate < startDate || newDate > endDate) {
        Alert.alert('Invalid Date', 'Session date must be within the study timeline');
        return prev;
      }
      
      // Check if another session already exists on this date
      const conflictingSession = sessions.find(s => 
        s.id !== sessionId && 
        s.date.toDateString() === newDate.toDateString()
      );
      
      if (conflictingSession) {
        Alert.alert('Date Conflict', 'Another session is already scheduled on this date');
        return prev;
      }
      
      sessions[sessionIndex] = {
        ...session,
        date: newDate
      };
      
      // Sort sessions by date
      return sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  };

  const toggleScheduleEditing = () => {
    setIsEditingSchedule(!isEditingSchedule);
  };

  const handleAddCourse = async () => {
    if (!courseName.trim() || !category || !totalSlides) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Course added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }, 1500);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Add New Course</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Course Name"
              placeholder="Enter course name"
              value={courseName}
              onChangeText={setCourseName}
            />
            
            <Input
              label="Total Slides"
              placeholder="Enter total number of slides"
              value={totalSlides}
              onChangeText={setTotalSlides}
              keyboardType="numeric"
            />
            
            <Text style={styles.categoryLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.selectedCategory,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.selectedCategoryText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Study Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.dateLabel}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {format(startDate, 'MMM dd, yyyy')}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            
            {showStartDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowStartDatePicker(false);
                    if (selectedDate) {
                      setStartDate(selectedDate);
                    }
                  }}
                />
              </View>
            )}

            <Text style={styles.dateLabel}>End Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {format(endDate, 'MMM dd, yyyy')}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            
            {showEndDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowEndDatePicker(false);
                    if (selectedDate) {
                      setEndDate(selectedDate);
                    }
                  }}
                />
              </View>
            )}

            <Button
              title="Generate Smart Schedule"
              onPress={generateSmartSchedule}
              variant="outline"
              style={styles.scheduleButton}
            />
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Upload Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload}>
              <Ionicons name="cloud-upload-outline" size={32} color="#007AFF" />
              <Text style={styles.uploadText}>Tap to upload files</Text>
              <Text style={styles.uploadSubtext}>
                PDF, DOC, PPT files supported
              </Text>
            </TouchableOpacity>
            
            {uploadedFiles.length > 0 && (
              <View style={styles.uploadedFilesContainer}>
                <Text style={styles.uploadedFilesTitle}>Uploaded Files ({uploadedFiles.length})</Text>
                {uploadedFiles.map((file) => (
                  <View key={file.id} style={styles.fileItem}>
                    <View style={styles.fileInfo}>
                      <Ionicons 
                        name={file.type.includes('pdf') ? 'document-text' : 
                              file.type.includes('word') ? 'document' : 
                              file.type.includes('powerpoint') ? 'easel' : 'document'} 
                        size={20} 
                        color="#007AFF" 
                      />
                      <View style={styles.fileDetails}>
                        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                        <Text style={styles.fileSize}>
                          {file.size > 0 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeFileButton}
                      onPress={() => removeFile(file.id)}
                    >
                      <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        {showSchedule && (
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.scheduleHeader}>
                <CardTitle>Your Smart Study Schedule</CardTitle>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={toggleScheduleEditing}
                >
                  <Ionicons 
                    name={isEditingSchedule ? "checkmark" : "create-outline"} 
                    size={20} 
                    color="#007AFF" 
                  />
                  <Text style={styles.editButtonText}>
                    {isEditingSchedule ? 'Done' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </CardHeader>
            <CardContent>
              <Text style={styles.scheduleInfo}>
                {studySessions.length} study sessions planned from {format(startDate, 'MMM dd')} to {format(endDate, 'MMM dd, yyyy')}
              </Text>
              {isEditingSchedule && (
                <View style={styles.editingInfo}>
                  <Ionicons name="information-circle" size={16} color="#007AFF" />
                  <Text style={styles.editingInfoText}>
                    Tap the arrows to shift sessions by one day
                  </Text>
                </View>
              )}
              <ScrollView style={styles.scheduleList} showsVerticalScrollIndicator={false}>
                {studySessions.map((session, index) => (
                  <View key={session.id} style={styles.sessionItem}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionDate}>
                        {format(session.date, 'MMM dd, yyyy')}
                      </Text>
                      <Text style={styles.sessionSlides}>
                        {session.slides} slides
                      </Text>
                    </View>
                    <View style={styles.sessionActions}>
                      <View style={styles.sessionNumber}>
                        <Text style={styles.sessionNumberText}>
                          Day {index + 1}
                        </Text>
                      </View>
                      {isEditingSchedule && (
                        <View style={styles.shiftButtons}>
                          <TouchableOpacity 
                            style={[styles.shiftButton, styles.shiftButtonLeft]}
                            onPress={() => shiftSession(session.id, 'backward')}
                          >
                            <Ionicons name="chevron-back" size={16} color="#007AFF" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.shiftButton, styles.shiftButtonRight]}
                            onPress={() => shiftSession(session.id, 'forward')}
                          >
                            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </CardContent>
          </Card>
        )}

        <Button
          title="Add Course"
          onPress={handleAddCourse}
          loading={loading}
          style={styles.addButton}
        />
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 12,
    marginTop: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#D1D1D6',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  uploadedFilesContainer: {
    marginTop: 16,
  },
  uploadedFilesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#8E8E93',
  },
  removeFileButton: {
    padding: 4,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  editingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  editingInfoText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    flex: 1,
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftButtons: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  shiftButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  shiftButtonLeft: {
    marginRight: 4,
  },
  shiftButtonRight: {
    marginLeft: 4,
  },
  addButton: {
    marginTop: 24,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
    marginTop: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  datePickerContainer: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#000000',
  },
  scheduleButton: {
    marginTop: 16,
  },
  scheduleInfo: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
    textAlign: 'center',
  },
  scheduleList: {
    maxHeight: 200,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  sessionSlides: {
    fontSize: 14,
    color: '#8E8E93',
  },
  sessionNumber: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sessionNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

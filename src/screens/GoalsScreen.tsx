import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useGoals, Goal } from '../contexts/GoalsContext';

export default function GoalsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { goals, addGoal, deleteGoal, toggleGoalCompletion, getTodaysGoals, getCompletionRate } = useGoals();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'daily' as Goal['type'],
    category: 'study' as Goal['category'],
    target: '',
    unit: '',
  });

  const todaysGoals = getTodaysGoals();
  const completionRate = getCompletionRate();

  const handleAddGoal = () => {
    if (!newGoal.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    addGoal({
      title: newGoal.title.trim(),
      description: newGoal.description.trim(),
      type: newGoal.type,
      category: newGoal.category,
      target: newGoal.target ? parseInt(newGoal.target) : undefined,
      unit: newGoal.unit.trim(),
    });

    setNewGoal({
      title: '',
      description: '',
      type: 'daily',
      category: 'study',
      target: '',
      unit: '',
    });
    setIsAddModalVisible(false);
    Alert.alert('Success', 'Goal added successfully!');
  };

  const handleDeleteGoal = (id: string, title: string) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => deleteGoal(id)
        },
      ]
    );
  };

  const getGoalIcon = (category: Goal['category']) => {
    switch (category) {
      case 'study': return 'book-outline';
      case 'time': return 'time-outline';
      case 'course': return 'school-outline';
      case 'personal': return 'person-outline';
      default: return 'flag-outline';
    }
  };

  const getGoalColor = (category: Goal['category']) => {
    switch (category) {
      case 'study': return '#007AFF';
      case 'time': return '#34C759';
      case 'course': return '#FF9500';
      case 'personal': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getTypeLabel = (type: Goal['type']) => {
    switch (type) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'one-time': return 'One-time';
      default: return type;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Progress Overview */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{completionRate}%</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completion Rate</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{todaysGoals.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today's Goals</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {todaysGoals.filter(g => g.completed).length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Today's Goals */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Today's Goals</CardTitle>
          </CardHeader>
          <CardContent>
            {todaysGoals.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="flag-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No goals for today. Tap + to add one!
                </Text>
              </View>
            ) : (
              todaysGoals.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalItem,
                    goal.completed && styles.completedGoal,
                    { borderColor: colors.border }
                  ]}
                  onPress={() => toggleGoalCompletion(goal.id)}
                >
                  <View style={styles.goalContent}>
                    <View style={styles.goalHeader}>
                      <View style={styles.goalIconContainer}>
                        <Ionicons 
                          name={getGoalIcon(goal.category)} 
                          size={20} 
                          color={getGoalColor(goal.category)} 
                        />
                      </View>
                      <View style={styles.goalInfo}>
                        <Text style={[
                          styles.goalTitle, 
                          { color: colors.text },
                          goal.completed && styles.completedText
                        ]}>
                          {goal.title}
                        </Text>
                        {goal.description && (
                          <Text style={[
                            styles.goalDescription, 
                            { color: colors.textSecondary }
                          ]}>
                            {goal.description}
                          </Text>
                        )}
                        <View style={styles.goalMeta}>
                          <Text style={[styles.goalType, { color: colors.textSecondary }]}>
                            {getTypeLabel(goal.type)}
                          </Text>
                          {goal.target && goal.unit && (
                            <Text style={[styles.goalTarget, { color: colors.textSecondary }]}>
                              • {goal.target} {goal.unit}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        goal.completed && styles.checkedBox,
                        { borderColor: goal.completed ? colors.success : colors.border }
                      ]}
                      onPress={() => toggleGoalCompletion(goal.id)}
                    >
                      {goal.completed && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteGoal(goal.id, goal.title)}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </CardContent>
        </Card>
      </View>

      {/* Add Goal Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Goal</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Input
                label="Goal Title *"
                placeholder="e.g., Study for 2 hours today"
                value={newGoal.title}
                onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
                style={styles.modalInput}
              />
              
              <Input
                label="Description"
                placeholder="Recommended description"
                value={newGoal.description}
                onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
                multiline
                numberOfLines={2}
                style={styles.modalInput}
              />

              <View style={styles.modalRow}>
                <View style={styles.modalInputHalf}>
                  <Text style={[styles.modalLabel, { color: colors.text }]}>Type</Text>
                  <View style={styles.typeButtons}>
                    {(['daily', 'weekly', 'monthly', 'one-time'] as const).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          newGoal.type === type && styles.selectedTypeButton,
                          { borderColor: colors.border }
                        ]}
                        onPress={() => setNewGoal({ ...newGoal, type })}
                      >
                        <Text style={[
                          styles.typeButtonText,
                          { color: colors.text },
                          newGoal.type === type && styles.selectedTypeButtonText
                        ]}>
                          {getTypeLabel(type)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.modalRow}>
                <View style={styles.modalInputHalf}>
                  <Text style={[styles.modalLabel, { color: colors.text }]}>Category</Text>
                  <View style={styles.categoryButtons}>
                    {(['study', 'time', 'course', 'personal'] as const).map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryButton,
                          newGoal.category === category && styles.selectedCategoryButton,
                          { borderColor: colors.border }
                        ]}
                        onPress={() => setNewGoal({ ...newGoal, category })}
                      >
                        <Ionicons 
                          name={getGoalIcon(category)} 
                          size={16} 
                          color={newGoal.category === category ? '#FFFFFF' : getGoalColor(category)} 
                        />
                        <Text style={[
                          styles.categoryButtonText,
                          { color: colors.text },
                          newGoal.category === category && styles.selectedCategoryButtonText
                        ]}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.modalRow}>
                <View style={styles.modalInputHalf}>
                  <Input
                    label="Target (Recommended)"
                    placeholder="e.g., 2"
                    value={newGoal.target}
                    onChangeText={(text) => setNewGoal({ ...newGoal, target: text })}
                    keyboardType="numeric"
                    style={styles.modalInput}
                  />
                </View>
                <View style={styles.modalInputHalf}>
                  <Input
                    label="Unit (Recommended)"
                    placeholder="e.g., hours"
                    value={newGoal.unit}
                    onChangeText={(text) => setNewGoal({ ...newGoal, unit: text })}
                    style={styles.modalInput}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setIsAddModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Add Goal"
                onPress={handleAddGoal}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  completedGoal: {
    backgroundColor: '#F8F9FA',
    opacity: 0.7,
  },
  goalContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  goalIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  goalDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  goalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalType: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  goalTarget: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkedBox: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  modalInput: {
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modalInputHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTypeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  selectedTypeButtonText: {
    color: '#FFFFFF',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 6,
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

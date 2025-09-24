import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'one-time';
  category: 'study' | 'time' | 'course' | 'personal';
  target?: number; // For numeric goals like "study for X hours"
  unit?: string; // Unit for target (hours, slides, etc.)
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  dueDate?: Date;
}

interface GoalsContextType {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'completed'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleGoalCompletion: (id: string) => void;
  getTodaysGoals: () => Goal[];
  getCompletedGoals: () => Goal[];
  getCompletionRate: () => number;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
};

export const GoalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const savedGoals = await AsyncStorage.getItem('goals');
      if (savedGoals !== null) {
        const parsedGoals = JSON.parse(savedGoals).map((goal: any) => ({
          ...goal,
          createdAt: new Date(goal.createdAt),
          completedAt: goal.completedAt ? new Date(goal.completedAt) : undefined,
          dueDate: goal.dueDate ? new Date(goal.dueDate) : undefined,
        }));
        setGoals(parsedGoals);
      } else {
        // Add some default goals for demo
        const defaultGoals: Goal[] = [
          {
            id: '1',
            title: 'Study for 2 hours today',
            description: 'Focus on completing course materials',
            type: 'daily',
            category: 'time',
            target: 2,
            unit: 'hours',
            completed: false,
            createdAt: new Date(),
          },
          {
            id: '2',
            title: 'Complete 10 slides',
            description: 'Work through Advanced Mathematics slides',
            type: 'daily',
            category: 'study',
            target: 10,
            unit: 'slides',
            completed: false,
            createdAt: new Date(),
          },
          {
            id: '3',
            title: 'Review notes for 30 minutes',
            description: 'Go through yesterday\'s study materials',
            type: 'daily',
            category: 'study',
            target: 30,
            unit: 'minutes',
            completed: true,
            createdAt: new Date(),
            completedAt: new Date(),
          },
        ];
        setGoals(defaultGoals);
        await AsyncStorage.setItem('goals', JSON.stringify(defaultGoals));
      }
    } catch (error) {
      console.log('Error loading goals:', error);
    }
  };

  const addGoal = async (goalData: Omit<Goal, 'id' | 'createdAt' | 'completed'>) => {
    try {
      const newGoal: Goal = {
        ...goalData,
        id: Date.now().toString(),
        createdAt: new Date(),
        completed: false,
      };
      const updatedGoals = [...goals, newGoal];
      setGoals(updatedGoals);
      await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));
    } catch (error) {
      console.log('Error adding goal:', error);
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const updatedGoals = goals.map(goal =>
        goal.id === id ? { ...goal, ...updates } : goal
      );
      setGoals(updatedGoals);
      await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));
    } catch (error) {
      console.log('Error updating goal:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const updatedGoals = goals.filter(goal => goal.id !== id);
      setGoals(updatedGoals);
      await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));
    } catch (error) {
      console.log('Error deleting goal:', error);
    }
  };

  const toggleGoalCompletion = async (id: string) => {
    try {
      const updatedGoals = goals.map(goal => {
        if (goal.id === id) {
          return {
            ...goal,
            completed: !goal.completed,
            completedAt: !goal.completed ? new Date() : undefined,
          };
        }
        return goal;
      });
      setGoals(updatedGoals);
      await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));
    } catch (error) {
      console.log('Error toggling goal completion:', error);
    }
  };

  const getTodaysGoals = () => {
    const today = new Date().toDateString();
    return goals.filter(goal => {
      if (goal.type === 'daily') return true;
      if (goal.type === 'weekly') {
        const goalDate = new Date(goal.createdAt);
        const daysDiff = Math.floor((Date.now() - goalDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff < 7;
      }
      if (goal.type === 'monthly') {
        const goalDate = new Date(goal.createdAt);
        const monthsDiff = (new Date().getFullYear() - goalDate.getFullYear()) * 12 + 
          (new Date().getMonth() - goalDate.getMonth());
        return monthsDiff < 1;
      }
      return !goal.completed;
    });
  };

  const getCompletedGoals = () => {
    return goals.filter(goal => goal.completed);
  };

  const getCompletionRate = () => {
    if (goals.length === 0) return 0;
    const completed = goals.filter(goal => goal.completed).length;
    return Math.round((completed / goals.length) * 100);
  };

  return (
    <GoalsContext.Provider value={{
      goals,
      addGoal,
      updateGoal,
      deleteGoal,
      toggleGoalCompletion,
      getTodaysGoals,
      getCompletedGoals,
      getCompletionRate,
    }}>
      {children}
    </GoalsContext.Provider>
  );
};

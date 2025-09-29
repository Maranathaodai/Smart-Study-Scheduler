import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../lib/types';
import { supabase } from '../lib/supabase';
// Removed dummy data imports

interface UserContextType {
  user: User;
  updateUser: (userData: Partial<User>) => void;
  resetUser: () => void;
  clearStoredUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>({
    id: '',
    name: '',
    email: '',
    bio: '',
    avatar: '',
    university: '',
    major: '',
    year: '',
    preferences: {
      darkMode: false,
      notifications: true,
      maxSlidesPerSession: 15,
      studyDays: [1, 2, 3, 4, 5],
      scheduleStartDate: new Date().toISOString(),
      scheduleEndDate: new Date(Date.now() + 21 * 86400000).toISOString(),
    },
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('userData');
      if (savedUser !== null) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      
      // Also update Supabase user metadata
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { error } = await supabase.auth.updateUser({
          data: {
            full_name: userData.name || user.name,
            bio: userData.bio || user.bio,
            university: userData.university || user.university,
            major: userData.major || user.major,
            year: userData.year || user.year,
            avatar_url: userData.avatar || user.avatar,
          }
        });
        
        if (error) {
          console.error('Error updating Supabase user metadata:', error);
        }
      }
    } catch (error) {
      console.log('Error saving user data:', error);
    }
  };

  const resetUser = async () => {
    try {
      // Reset to default user state
      const defaultUser = {
        id: '',
        name: '',
        email: '',
        bio: '',
        avatar: '',
        university: '',
        major: '',
        year: '',
        preferences: {
          darkMode: false,
          notifications: true,
          maxSlidesPerSession: 15,
          studyDays: [1, 2, 3, 4, 5],
          scheduleStartDate: new Date().toISOString(),
          scheduleEndDate: new Date(Date.now() + 21 * 86400000).toISOString(),
        },
      };
      setUser(defaultUser);
      await AsyncStorage.setItem('userData', JSON.stringify(defaultUser));
    } catch (error) {
      console.log('Error resetting user data:', error);
    }
  };

  const clearStoredUserData = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      // Reset to default user state
      const defaultUser = {
        id: '',
        name: '',
        email: '',
        bio: '',
        avatar: '',
        university: '',
        major: '',
        year: '',
        preferences: {
          darkMode: false,
          notifications: true,
          maxSlidesPerSession: 15,
          studyDays: [1, 2, 3, 4, 5],
          scheduleStartDate: new Date().toISOString(),
          scheduleEndDate: new Date(Date.now() + 21 * 86400000).toISOString(),
        },
      };
      setUser(defaultUser);
    } catch (error) {
      console.log('Error clearing user data:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, updateUser, resetUser, clearStoredUserData }}>
      {children}
    </UserContext.Provider>
  );
};

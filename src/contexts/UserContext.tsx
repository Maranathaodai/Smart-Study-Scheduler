import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../lib/types';
import { dummyUser } from '../lib/dummy-data';

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
  const [user, setUser] = useState<User>(dummyUser);

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
    } catch (error) {
      console.log('Error saving user data:', error);
    }
  };

  const resetUser = async () => {
    try {
      setUser(dummyUser);
      await AsyncStorage.setItem('userData', JSON.stringify(dummyUser));
    } catch (error) {
      console.log('Error resetting user data:', error);
    }
  };

  const clearStoredUserData = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      setUser(dummyUser);
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

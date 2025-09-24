import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { UserProvider } from './src/contexts/UserContext';
import { GoalsProvider } from './src/contexts/GoalsContext';

// Import screens
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddCourseScreen from './src/screens/AddCourseScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import DailyStudyScreen from './src/screens/DailyStudyScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StudyScheduleScreen from './src/screens/StudyScheduleScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import PrivacySecurityScreen from './src/screens/PrivacySecurityScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import AboutScreen from './src/screens/AboutScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AuthWrapper({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuthStart">
        {(props) => <AuthScreen {...props} onComplete={() => navigation.replace('MainTabs')} />}
      </Stack.Screen>
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Courses') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Courses" component={CoursesScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [appState, setAppState] = useState('splash');

  return (
    <ThemeProvider>
      <UserProvider>
        <GoalsProvider>
          {appState === 'splash' ? (
          <SplashScreen onComplete={() => setAppState('onboarding')} />
        ) : appState === 'onboarding' ? (
          <OnboardingScreen onComplete={() => setAppState('auth')} />
        ) : appState === 'auth' ? (
          // Auth flow is wrapped in its own NavigationContainer so screens can navigate (e.g., Forgot Password)
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="AuthStart">
                {(props) => <AuthScreen {...props} onComplete={() => setAppState('app')} />}
              </Stack.Screen>
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        ) : (
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="Auth" component={AuthWrapper} />
              <Stack.Screen name="AddCourse" component={AddCourseScreen} />
              <Stack.Screen name="DailyStudy" component={DailyStudyScreen} />
              <Stack.Screen name="StudySchedule" component={StudyScheduleScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
              <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
              <Stack.Screen name="About" component={AboutScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="Goals" component={GoalsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        )}
        <StatusBar style="auto" />
        </GoalsProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

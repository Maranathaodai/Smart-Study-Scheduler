# Smart Study Scheduler - Mobile App

A React Native mobile application for organizing and scheduling study sessions with AI-powered course planning.

## Features

- 📚 Course Management - Upload and organize course materials
- 📅 Smart Scheduling - AI-generated study plans based on your schedule
- 📊 Progress Tracking - Monitor your learning journey with detailed analytics
- 🎯 Daily Study Sessions - Interactive study sessions with progress tracking
- 📱 Mobile-First Design - Optimized for mobile devices
- 🔔 Notifications - Study reminders and progress updates

## Prerequisites

Before running this app, make sure you have the following installed:

-- Node.js (v16 or later)
-- npm or yarn
-- Expo CLI (`npm install -g @expo/cli`)
-- iOS Simulator (for iOS development) or Android Studio (for Android development)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web browser
npm run web
```

## Project Structure

```
src/
├── components/
│   └── ui/           # Reusable UI components
├── screens/          # Screen components
├── lib/              # Utilities and data
└── App.js           # Main app component
```

## Key Technologies

- **React Native** - Mobile app framework
- **Expo** - Development platform and tools
- **React Navigation** - Navigation library
- **TypeScript** - Type safety
- **Expo Vector Icons** - Icon library

## Development

The app uses Expo for development, which provides:
- Hot reloading for fast development
- Easy testing on physical devices via Expo Go app
- Built-in development tools

## Building for Production

To build the app for production:

1. **iOS**: Use EAS Build or Expo CLI
2. **Android**: Use EAS Build or Expo CLI

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Features Overview

### Dashboard
- Welcome screen with user greeting
- Progress overview
- Today's study session preview
- Quick action buttons

### Courses
- List of all courses
- Progress tracking per course
- Course management options

### Calendar
- Monthly view of study sessions
- Session scheduling
- Progress visualization

### Study Sessions
- Interactive slide-based study
- Progress tracking
- Study tips and guidance

### Progress
- Detailed analytics
- Achievement system
- Study insights and recommendations

### Profile
- User settings
- Preferences management
- Study statistics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

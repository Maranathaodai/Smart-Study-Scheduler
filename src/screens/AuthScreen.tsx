import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface AuthScreenProps {
  onComplete: () => void;
}

export default function AuthScreen({ onComplete }: AuthScreenProps) {
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onComplete();
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Image source={require('../images/logo.png')} style={styles.logoImage} />
          </View>
          <Text style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin 
              ? 'Sign in to continue your learning journey' 
              : 'Join us and start organizing your studies'
            }
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
            />
          )}
          
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
          />
          
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {isLogin && (
            <View style={styles.forgotRow}>
              <Text style={styles.spacer} />
              <Text
                onPress={() => (navigation as any).navigate('ForgotPassword')}
                style={styles.forgotLink}
              >
                Forgot password?
              </Text>
            </View>
          )}

          <Button
            title={isLogin ? 'Sign In' : 'Create Account'}
            onPress={handleAuth}
            loading={loading}
            style={styles.authButton}
          />

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <Button
              title={isLogin ? 'Sign Up' : 'Sign In'}
              onPress={() => setIsLogin(!isLogin)}
              variant="outline"
              size="sm"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 0,
  },
  logoImage: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  authButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  spacer: {
    flex: 1,
  },
  forgotLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  switchText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});

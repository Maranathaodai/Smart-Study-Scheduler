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
import { authService } from '../lib/supabaseAuthService';

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

    // Basic validation
    if (!isLogin && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        console.log('🔑 Attempting login...');
        await authService.signIn({ email, password });
        console.log('✅ Login successful');
      } else {
        console.log('👤 Attempting signup...');
        await authService.signUp({ email, password, full_name: name });
        console.log('✅ Signup successful');
        
        // Show success message and switch to login mode
        Alert.alert(
          'Account Created!', 
          'Account Creation Successful',
          [{ 
            text: 'OK', 
            onPress: () => {
              // Clear the form and switch to login mode
              setPassword('');
              setName('');
              setIsLogin(true);
            }
          }]
        );
        return; // Don't call onComplete(), stay on auth screen for login
      }
      
      onComplete();
      
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Provide more specific error messages
      let errorMessage = error.message;
      
      if (error.message.includes('invalid_credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('email_address_invalid')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message.includes('weak_password')) {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.message.includes('email_address_not_authorized')) {
        errorMessage = 'This email domain is not authorized. Please use a different email.';
      } else if (error.message.includes('signup_disabled')) {
        errorMessage = 'Account creation is currently disabled. Please contact support.';
      } else if (error.message.includes('email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      }
      
      Alert.alert('Authentication Error', errorMessage);
    } finally {
      setLoading(false);
    }
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

          {/* Traditional Email/Password Form */}
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

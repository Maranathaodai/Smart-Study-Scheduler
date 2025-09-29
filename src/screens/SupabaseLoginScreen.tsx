import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const SupabaseLoginScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { signIn, confirmUserEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Navigation will be handled by AuthProvider
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // If it's an email confirmation error, offer to confirm manually
      if (error.message.includes('email not confirmed')) {
        Alert.alert(
          'Email Not Confirmed',
          'Your email is not confirmed. Would you like to confirm it manually?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Confirm Email', 
              onPress: async () => {
                try {
                  const confirmed = await confirmUserEmail(email.trim());
                  if (confirmed) {
                    Alert.alert('Success', 'Email confirmed! Please try signing in again.');
                  } else {
                    Alert.alert('Error', 'Failed to confirm email. Please contact support.');
                  }
                } catch (confirmError) {
                  Alert.alert('Error', 'Failed to confirm email. Please contact support.');
                }
              }
            },
          ]
        );
      } else {
        Alert.alert('Sign In Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to continue your study journey
          </Text>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              style={styles.signInButton}
            />

            <Button
              title="Forgot Password?"
              onPress={handleForgotPassword}
              variant="outline"
              style={styles.forgotButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <Button
              title="Sign Up"
              onPress={handleSignUp}
              variant="outline"
              style={styles.signUpButton}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  signInButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  forgotButton: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 16,
  },
  signUpButton: {
    marginLeft: 4,
  },
});

export default SupabaseLoginScreen;



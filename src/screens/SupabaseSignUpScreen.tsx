import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const SupabaseSignUpScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    console.log('📩 Create Account pressed');

    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long and include a number and a special character.');
      return;
    }

    // Require at least one number and one special character for stronger security
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    if (!hasNumber || !hasSpecialChar) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 6 characters and include at least one number and one special character.'
      );
      return;
    }

    setLoading(true);
    try {
      console.log('📡 Calling signUp with:', {
        email: email.trim(),
        hasPassword: !!password,
        hasFullName: !!fullName.trim(),
      });
      await signUp(email.trim(), password, fullName.trim());
      Alert.alert(
        'Account Created!',
        'Your account has been created successfully.\n\nPlease log in with your new credentials.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Sign Up Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };


  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join Smart Study Scheduler and start your learning journey
          </Text>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

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
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Text style={[styles.passwordHint, { color: colors.textSecondary }]}>
              Password must be at least 6 characters and include a number and a special character.
            </Text>

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <Button
              title="Create Account"
              onPress={() => {
                // Extra log to guarantee we see button presses in the console
                console.log('✅ Create Account button onPress fired');
                handleSignUp();
              }}
              loading={loading}
              style={styles.signUpButton}
            />
          </View>


          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <Button
              title="Sign In"
              onPress={handleSignIn}
              variant="outline"
              style={styles.signInButton}
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
  passwordHint: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  signUpButton: {
    marginTop: 16,
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
  signInButton: {
    marginLeft: 4,
  },
});

export default SupabaseSignUpScreen;



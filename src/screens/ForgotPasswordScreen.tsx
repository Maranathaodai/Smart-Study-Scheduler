import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Check your inbox', 'If an account exists, a reset link has been sent.');
      navigation.goBack();
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your email to reset your password.</Text>
        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Button title="Send reset link" onPress={handleReset} loading={loading} style={styles.button} />
        <Button title="Back to Sign In" onPress={() => navigation.goBack()} variant="outline" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000000', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#8E8E93', textAlign: 'center', marginBottom: 16 },
  button: { marginTop: 12, marginBottom: 12 },
});



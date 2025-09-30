import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CONFIG, validateConfig, getOpenRouterApiKey, printConfigStatus } from '../lib/config';

// Component to test and display configuration status
// Add this to any screen temporarily to verify your environment setup
export function ConfigTestComponent() {
  React.useEffect(() => {
    // Print configuration status to console
    printConfigStatus();
  }, []);

  const validation = validateConfig();
  const apiKey = getOpenRouterApiKey();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Configuration Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment Variables:</Text>
        <Text style={styles.item}>
          📍 OPENROUTER_API_KEY: {CONFIG.OPENROUTER.API_KEY ? '✅ Loaded' : '❌ Missing'}
        </Text>
        <Text style={styles.item}>
          📍 SUPABASE_URL: {CONFIG.SUPABASE.URL ? '✅ Loaded' : '❌ Missing'}
        </Text>
        <Text style={styles.item}>
          📍 SUPABASE_ANON_KEY: {CONFIG.SUPABASE.ANON_KEY ? '✅ Loaded' : '❌ Missing'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration Status:</Text>
        <Text style={[styles.item, validation.isValid ? styles.success : styles.error]}>
          {validation.isValid ? '✅ Valid' : '❌ Issues Found'}
        </Text>
        
        {validation.missingKeys.length > 0 && (
          <View style={styles.subsection}>
            <Text style={styles.subtitle}>Missing Keys:</Text>
            {validation.missingKeys.map((key, index) => (
              <Text key={index} style={[styles.item, styles.error]}>• {key}</Text>
            ))}
          </View>
        )}
        
        {validation.warnings.length > 0 && (
          <View style={styles.subsection}>
            <Text style={styles.subtitle}>Warnings:</Text>
            {validation.warnings.map((warning, index) => (
              <Text key={index} style={[styles.item, styles.warning]}>• {warning}</Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Key Status:</Text>
        <Text style={[styles.item, apiKey ? styles.success : styles.error]}>
          {apiKey ? '✅ API Key Ready' : '❌ API Key Not Ready'}
        </Text>
        {apiKey && (
          <Text style={styles.item}>
            🔑 Key Preview: {apiKey.substring(0, 15)}...
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Next Steps:</Text>
        {!apiKey || apiKey.includes('your_api_key_here') ? (
          <>
            <Text style={styles.item}>1. Go to https://openrouter.ai/</Text>
            <Text style={styles.item}>2. Get your API key</Text>
            <Text style={styles.item}>3. Update .env file</Text>
            <Text style={styles.item}>4. Restart the app</Text>
          </>
        ) : (
          <Text style={[styles.item, styles.success]}>✅ Ready to use AI features!</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
    color: '#555',
  },
  subsection: {
    marginTop: 10,
  },
  item: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
    lineHeight: 20,
  },
  success: {
    color: '#28a745',
  },
  error: {
    color: '#dc3545',
  },
  warning: {
    color: '#ffc107',
  },
});
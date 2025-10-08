import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ProcessingAnimation from './ProcessingAnimation';
import { processingTracker } from '../../lib/processingTracker';

export const ProcessingDemo: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const handleProgress = (progressData: any) => {
      setProgress(progressData.progress);
      setStatus(progressData.status);
      setDetails(progressData);
    };

    const handleComplete = () => {
      setIsProcessing(false);
      setDetails(null);
    };

    processingTracker.on('progress', handleProgress);
    processingTracker.on('complete', handleComplete);

    return () => {
      processingTracker.off('progress', handleProgress);
      processingTracker.off('complete', handleComplete);
    };
  }, []);

  const startDemo = async () => {
    setIsProcessing(true);
    await processingTracker.simulateRealisticProcessing('sample-document.pdf', 1, 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Processing Animation Demo</Text>
      
      {!isProcessing && (
        <TouchableOpacity style={styles.button} onPress={startDemo}>
          <Text style={styles.buttonText}>Start Demo Processing</Text>
        </TouchableOpacity>
      )}

      {isProcessing && details && (
        <ProcessingAnimation
          progress={details.progress}
          status={details.status}
          isVisible={isProcessing}
          fileName={details.fileName}
          fileCount={details.fileCount}
          currentFileIndex={details.currentFileIndex}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProcessingDemo;

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message?.toUpperCase() || 'CONNECTION ERROR: UNABLE TO CONTACT GATEWAY'}</Text>
      
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.btnText}>RETRY INQUIRY</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ef4444',
  },
});

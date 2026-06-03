import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

export default function LoadingView({ message }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#38bdf8" />
      <Text style={styles.text}>{message?.toUpperCase() || 'ACQUIRING TELEMETRY STREAM...'}</Text>
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
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 12,
    letterSpacing: 1.5,
  },
});

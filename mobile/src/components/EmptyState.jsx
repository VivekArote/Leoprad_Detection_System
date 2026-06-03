import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function EmptyState({ message }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message?.toUpperCase() || 'NO RECORDED OBSERVATIONS FOUND'}</Text>
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
    borderColor: '#1e293b',
    borderStyle: 'dashed',
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
    textAlign: 'center',
    letterSpacing: 1,
  },
});

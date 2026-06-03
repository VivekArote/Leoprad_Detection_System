import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

export default function SearchBar({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'SEARCH BY CAMERA / CLASS...'}
        placeholderTextColor="#475569"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  input: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#f8fafc',
    padding: 0, // removes default android padding
  },
});

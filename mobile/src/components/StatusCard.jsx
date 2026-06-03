import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function StatusCard({ label, value, status }) {
  const textVal = String(value || status || 'unknown').toLowerCase();
  const isHealthy = 
    textVal === 'healthy' || 
    textVal === 'connected' || 
    textVal === 'online' || 
    textVal === 'running' || 
    textVal === 'ok';

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label?.toUpperCase()}</Text>
      <Text style={[styles.value, isHealthy ? styles.healthy : styles.unhealthy]}>
        {textVal.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
    marginBottom: 6,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  value: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
  },
  healthy: {
    color: '#10b981', // emerald-500
  },
  unhealthy: {
    color: '#ef4444', // red-500
  },
});

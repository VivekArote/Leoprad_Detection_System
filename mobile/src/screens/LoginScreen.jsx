import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useServer } from '../context/ServerContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const { serverUrl, updateServerUrl } = useServer();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverInput, setServerInput] = useState(serverUrl);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state if serverUrl changes in context
  React.useEffect(() => {
    setServerInput(serverUrl);
  }, [serverUrl]);

  const handleLogin = async () => {
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('VALIDATION ERROR: FIELDS CANNOT BE EMPTY');
      return;
    }

    if (!serverInput.trim()) {
      setError('VALIDATION ERROR: GATEWAY SERVER URL IS REQUIRED');
      return;
    }

    setLoading(true);
    try {
      await updateServerUrl(serverInput.trim());
      await login(email.trim(), password, rememberMe);
    } catch (err) {
      setError(err.message?.toUpperCase() || 'LOGIN REJECTED: UNABLE TO VALIDATE CREDENTIALS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.innerContainer}>
          {/* Header Typography */}
          <View style={styles.header}>
            <Text style={styles.title}>LEOPARD DETECTION SYSTEM</Text>
            <Text style={styles.subtitle}>FIELD MONITORING GATEWAY ACCESS</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Gateway Server IP field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>GATEWAY SERVER URL</Text>
              <TextInput
                style={styles.input}
                value={serverInput}
                onChangeText={setServerInput}
                placeholder="http://10.229.228.110:3000"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Email field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>OPERATOR EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="e.g. ranger@forest.gov"
                placeholderTextColor="#475569"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ACCESS PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••••"
                placeholderTextColor="#475569"
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Remember Me switch */}
            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>REMEMBER LOGIN CREDENTIALS</Text>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{ false: '#1e293b', true: '#334155' }}
                thumbColor={rememberMe ? '#38bdf8' : '#64748b'}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#090d16" size="small" />
              ) : (
                <Text style={styles.btnText}>INITIALIZE SESSION</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#64748b',
    marginTop: 6,
    letterSpacing: 1.5,
  },
  form: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ef4444',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 6,
    letterSpacing: 1,
  },
  input: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#f8fafc',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  btnText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#090d16',
    letterSpacing: 1.5,
  },
});

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);
const AUTH_KEY = '@leopard_auth_token';
const REMEMBER_USER_KEY = '@leopard_remember_user';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check login status on mount
  useEffect(() => {
    async function loadAuth() {
      try {
        const token = await AsyncStorage.getItem(AUTH_KEY);
        if (token) {
          setIsAuthenticated(true);
          setUser({ email: token }); // Simple Mock User
        }
      } catch (err) {
        console.error('Failed to load auth token', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAuth();
  }, []);

  const login = async (email, password, rememberMe = true) => {
    // Standard validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Mock Login Success
    const token = email.toLowerCase();
    setUser({ email: token });
    setIsAuthenticated(true);

    if (rememberMe) {
      try {
        await AsyncStorage.setItem(AUTH_KEY, token);
        await AsyncStorage.setItem(REMEMBER_USER_KEY, email);
      } catch (err) {
        console.error('Failed to save remember me settings', err);
      }
    } else {
      try {
        await AsyncStorage.removeItem(AUTH_KEY);
      } catch (err) {}
    }
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
    } catch (err) {
      console.error('Failed to clear session', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

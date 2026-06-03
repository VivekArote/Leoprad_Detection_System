import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DetectionsScreen from '../screens/DetectionsScreen';
import DetectionDetailsScreen from '../screens/DetectionDetailsScreen';
import GalleryScreen from '../screens/GalleryScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import HealthScreen from '../screens/HealthScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Text-only Bottom Tab Navigator
function TabNavigator() {
  const { logout } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a',
          borderBottomWidth: 1,
          borderBottomColor: '#1e293b',
        },
        headerTitleStyle: {
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#f8fafc',
          letterSpacing: 1.5,
        },
        headerRight: () => (
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopWidth: 1,
          borderTopColor: '#1e293b',
          height: 60,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontFamily: 'monospace',
          fontSize: 8.5,
          fontWeight: 'bold',
          letterSpacing: 0.5,
        },
        // Disable icons entirely
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'DASHBOARD' }}
      />
      <Tab.Screen 
        name="Detections" 
        component={DetectionsScreen} 
        options={{ title: 'DETECTIONS' }}
      />
      <Tab.Screen 
        name="Gallery" 
        component={GalleryScreen} 
        options={{ title: 'GALLERY' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen} 
        options={{ title: 'ANALYTICS' }}
      />
      <Tab.Screen 
        name="Health" 
        component={HealthScreen} 
        options={{ title: 'HEALTH' }}
      />
    </Tab.Navigator>
  );
}

// Master Stack Navigator
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>CHECKING GATEWAY SECURITY KEY...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a',
          borderBottomWidth: 1,
          borderBottomColor: '#1e293b',
        },
        headerTitleStyle: {
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#f8fafc',
          letterSpacing: 1.5,
        },
        headerTintColor: '#38bdf8', // back button color
        headerBackTitleStyle: {
          fontFamily: 'monospace',
          fontSize: 9,
        },
        contentStyle: {
          backgroundColor: '#090d16',
        }
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={TabNavigator} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="DetectionDetails" 
            component={DetectionDetailsScreen} 
            options={{ title: 'DETECTIONS DATABASE' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 2,
  },
  logoutBtn: {
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutText: {
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ef4444',
  },
});

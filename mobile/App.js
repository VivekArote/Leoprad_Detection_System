import React, { useEffect } from 'react';
import { LogBox, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import * as Notifications from 'expo-notifications';

import { AuthProvider } from './src/context/AuthContext';
import { ServerProvider } from './src/context/ServerContext';
import AppNavigator from './src/navigation/AppNavigator';

// Silence unnecessary third-party warnings in Dev terminal
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
]);

// Configure TanStack Query Client with caching logic for offline capabilities
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes cache stale duration
      cacheTime: 1000 * 60 * 30, // 30 minutes garbage collection timer
      refetchOnWindowFocus: false, // disable focus refetching on mobile
    },
  },
});

// Custom Theme configuration matching our Slate/Navy layout
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#38bdf8',
    background: '#090d16',
    surface: '#0f172a',
    error: '#ef4444',
  },
};

// Configure Notification handling behavior when app is active
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  // Push Notification setup hook
  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      if (Platform.OS === 'web') return;
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Notification permission was rejected!');
        return;
      }

      try {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('📬 Expo Push Token Registered:', token);
        // Note: You can POST this token to your backend "/api/notifications/register"
        // to associate it with this device and trigger native remote notifications.
      } catch (err) {
        console.warn('Failed to obtain Expo Push Token', err.message);
      }

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    }

    registerForPushNotificationsAsync();

    // Foreground notification listener
    const notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received in foreground:', notification);
    });

    // Notification click listener
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Pressed notification response:', response);
    });

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <ServerProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </ServerProvider>
        </AuthProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}

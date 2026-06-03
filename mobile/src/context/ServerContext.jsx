import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { Vibration } from 'react-native';

const ServerContext = createContext(null);
const STORAGE_KEY = '@leopard_server_url';
const DEFAULT_SERVER = 'http://192.168.1.100:3000';

export function ServerProvider({ children }) {
  const [serverUrl, setServerUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const [liveAlerts, setLiveAlerts] = useState([]);
  const socketRef = useRef(null);

  // Load server URL on mount
  useEffect(() => {
    async function loadUrl() {
      try {
        const savedUrl = await AsyncStorage.getItem(STORAGE_KEY);
        const urlToUse = savedUrl || DEFAULT_SERVER;
        setServerUrl(urlToUse);
        connectSocket(urlToUse);
      } catch (err) {
        console.error('Failed to load server URL from AsyncStorage', err);
        setServerUrl(DEFAULT_SERVER);
        connectSocket(DEFAULT_SERVER);
      }
    }
    loadUrl();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const connectSocket = (url) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    setConnectionStatus('CONNECTING');
    const cleanUrl = url.replace(/\/$/, '');

    const socket = io(cleanUrl, {
      transports: ['websocket'],
      forceNew: true,
      timeout: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('CONNECTED');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('DISCONNECTED');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('DISCONNECTED');
    });

    // Listen for live leopard alerts
    socket.on('new-detection', (detection) => {
      // Vibrate device: wait 0ms, vibrate 500ms, wait 200ms, vibrate 500ms
      Vibration.vibrate([0, 500, 200, 500]);
      
      setLiveAlerts((prev) => [detection, ...prev].slice(0, 20));
    });
  };

  const updateServerUrl = async (newUrl) => {
    try {
      let formattedUrl = newUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'http://' + formattedUrl;
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, formattedUrl);
      setServerUrl(formattedUrl);
      connectSocket(formattedUrl);
    } catch (err) {
      console.error('Failed to save Server URL', err);
    }
  };

  const clearLiveAlerts = () => {
    setLiveAlerts([]);
  };

  return (
    <ServerContext.Provider value={{
      serverUrl: serverUrl.replace(/\/$/, ''),
      connectionStatus,
      liveAlerts,
      updateServerUrl,
      clearLiveAlerts,
      socket: socketRef.current
    }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
}

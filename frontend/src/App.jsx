import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Detections from './pages/Detections';
import Gallery from './pages/Gallery';
import Analytics from './pages/Analytics';
import Health from './pages/Health';
import Settings from './pages/Settings';

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const basename = import.meta.env.DEV ? '/' : '/dashboard';

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={basename}>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/detections" element={<Detections />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/health" element={<Health />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

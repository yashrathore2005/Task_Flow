import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from './components/AuthProvider';
import { useAuthStore } from './store/authStore';
import { useTasksStore } from './store/tasksStore';
import AppLayout from './layouts/AppLayout';
import { Toaster } from 'sonner';
import { OfflineBanner } from './components/OfflineBanner';

const Auth = React.lazy(() => import('./pages/Auth'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Habits = React.lazy(() => import('./pages/Habits'));
const Focus = React.lazy(() => import('./pages/Focus'));
const Notes = React.lazy(() => import('./pages/Notes'));
const Countdowns = React.lazy(() => import('./pages/Countdowns'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Analytics = React.lazy(() => import('./pages/Analytics'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  
  if (loading) {
    return <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground animate-pulse">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-semibold text-gray-500">Loading your workspace...</p>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return <>{children}</>;
}

import { SplashScreen } from './components/layout/SplashScreen';

function AppContent() {
  const [showSplash, setShowSplash] = React.useState(true);
  const { user, loading } = useAuthStore();

  // We finish splash only when the timer is done AND auth is not loading
  const handleSplashFinish = () => {
    if (!loading) {
      setShowSplash(false);
    } else {
      // If still loading, wait a bit more and try again
      setTimeout(handleSplashFinish, 500);
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} />
          <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
          
          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/countdowns" element={<Countdowns />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          {/* Fallback for legacy /landing if it existed or generic 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OfflineBanner />
        <AppContent />
        <Toaster position="bottom-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}

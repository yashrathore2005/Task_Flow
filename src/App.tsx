import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from './components/AuthProvider';
import { useAuthStore } from './store/authStore';
import AppLayout from './layouts/AppLayout';
import { Toaster } from 'sonner';
import { OfflineBanner } from './components/OfflineBanner';

const Landing = React.lazy(() => import('./pages/Landing'));
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

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OfflineBanner />
        <BrowserRouter>
          <Suspense fallback={
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              
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
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="bottom-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}

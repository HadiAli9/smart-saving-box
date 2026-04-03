import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Boxes from './pages/Boxes';
import Vault from './pages/Vault';
import CalendarView from './pages/CalendarView';
import Settings from './pages/Settings';
import BoxDetails from './pages/BoxDetails';
import PinLock from './components/PinLock';
import Login from './pages/Login';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  return user ? <PinLock><Layout>{children}</Layout></PinLock> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/boxes" element={<PrivateRoute><Boxes /></PrivateRoute>} />
          <Route path="/vault" element={<PrivateRoute><Vault /></PrivateRoute>} />
          <Route path="/boxes/:boxId" element={<PrivateRoute><BoxDetails /></PrivateRoute>} />
          <Route path="/calendar" element={<PrivateRoute><CalendarView /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

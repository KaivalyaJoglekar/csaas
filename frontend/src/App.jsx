import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import AdminUsers from './components/AdminUsers';
import VendorList from './components/VendorList';
import VendorDetail from './components/VendorDetail';
import Scanner from './components/Scanner';
import Reporter from './components/Reporter';
import MaliciousContentAnalyzer from './components/MaliciousContentAnalyzer'; // Import the new component

const ProtectedRoute = ({ children }) => {
    const { session, loading } = useAuth();
    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loader-spinner"></div>
            </div>
        );
    }
    if (!session) {
        return <Navigate to="/" replace />;
    }
    return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AuthForm />} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/reports" element={<Reporter />} />
        <Route path="/analyzer" element={<MaliciousContentAnalyzer />} /> {/* Add the new route */}
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/vendors" element={<VendorList />} />
        <Route path="/vendors/:id" element={<VendorDetail />} />
      </Route>

      <Route path="*" element={<h2 style={{textAlign: 'center', marginTop: '40px'}}>404: Page Not Found</h2>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
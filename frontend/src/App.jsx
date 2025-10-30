import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import AdminUsers from './components/AdminUsers';
import VendorList from './components/VendorList';
import VendorDetail from './components/VendorDetail';
import Scanner from './components/Scanner';
import Reporter from './components/Reporter';



export const ThemeContext = React.createContext();

const ProtectedRoute = ({ children }) => {
    const { session, loading } = useAuth();
    // Show loader while checking auth state
    if (loading) return <GlobalLoader />;
    // Redirect to login if not authenticated
    if (!session) return <Navigate to="/" replace />;
    // Render children if authenticated
    return children;
};

const GlobalLoader = () => (
    <div className="loader-container"><div className="loader-spinner"></div></div>
);

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <GlobalLoader />;
  return (
    <Routes>
      <Route path="/" element={<AuthForm />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reporter /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
      <Route path="/vendors" element={<ProtectedRoute><VendorList /></ProtectedRoute>} />
      <Route path="/vendors/:id" element={<ProtectedRoute><VendorDetail /></ProtectedRoute>} />
      <Route path="*" element={<h2>404 Not Found</h2>} />
    </Routes>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = useState('dark'); // Default to dark for premium feel

  useEffect(() => {
    document.body.className = themeMode === 'dark' ? 'dark-mode' : '';
  }, [themeMode]);
  
  const toggleTheme = () => {
    setThemeMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ toggleTheme, themeMode }}>
      <div id="app-background">
        <div className="mesh-blob blob-1"></div>
        <div className="mesh-blob blob-2"></div>
        <div className="mesh-blob blob-3"></div>
      </div>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}
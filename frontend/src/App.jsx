import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';

// Custom component for protected routes
const ProtectedRoute = ({ children }) => {
    const { session, loading } = useAuth();
    
    // NOTE: This check is redundant now, but kept as a safeguard.
    // The main loading check is in AppRoutes.
    if (loading) {
        return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading session...</p>;
    }

    if (!session) {
        // Redirect to login if not authenticated
        return <Navigate to="/" replace />;
    }

    return children;
};


function AppRoutes() {
  const { loading } = useAuth();

  // FIX: Conditionally render the entire router based on AuthContext loading state
  if (loading) {
    // Show a global loading message while Supabase checks the initial session
    return <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.2rem', color: '#007AFF' }}>Initializing Application...</p>;
  }

  return (
    <Routes>
      {/* Login page is always visible at the root */}
      <Route path="/" element={<AuthForm />} />
      
      {/* Dashboard route is protected */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch-all for 404 */}
      <Route path="*" element={<p style={{ textAlign: 'center', marginTop: '50px' }}>404 Not Found</p>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* AppRoutes contains the necessary loading check */}
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
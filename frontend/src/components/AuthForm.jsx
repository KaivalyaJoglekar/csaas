// frontend/src/components/AuthForm.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuthForm.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function AuthForm() {
  const [toasts, setToasts] = useState([]); // {id, message, type}
  // app uses single light monochrome theme
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('sme');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, getAndSetSession, session } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        // Wait a bit for the session to be set, then navigate
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      } else {
        // First, sign up the user with Supabase
        const { error: signUpError, data } = await signUp(email, password);
        if (signUpError) throw signUpError;
        
        // If signup is successful, we need to ensure the user profile exists
        // and update the user's role
        if (data?.user?.id) {
          try {
            // First, try to create the user profile if it doesn't exist
            await axios.post(`${API_URL}/api/auth/create-profile`, {
              user_id: data.user.id,
              email: email,
              role: selectedRole
            });
            
            // Then, try to set the user role
            await axios.post(`${API_URL}/api/admin/set-user-role`, {
              user_id: data.user.id,
              role: selectedRole
            });
          } catch (profileError) {
            console.error('Error creating/setting user profile:', profileError);
            // Even if profile creation fails, we don't want to prevent signup
          }
        }
        // Wait a bit for the session to be set, then navigate
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      }
      await getAndSetSession();
    } catch (error) {
      const msg = error?.message || 'Authentication error';
      pushToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const pushToast = (message, type = 'info', timeout = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, message, type }]);
    setTimeout(() => {
      setToasts((s) => s.filter((t) => t.id !== id));
    }, timeout);
  };

  return (
    <div className="auth-modern-bg">
      {/* Animated background elements */}
      <div className="auth-modern-bg-elements">
        <div className="auth-modern-bg-element bg-element-1"></div>
        <div className="auth-modern-bg-element bg-element-2"></div>
        <div className="auth-modern-bg-element bg-element-3"></div>
      </div>

      {/* Main auth container */}
      <div className="auth-modern-container">
        <div className="auth-modern-card">
          <div className="auth-modern-card-inner">
            {/* Branding/Logo area */}
            <div className="auth-modern-header">
              <h1 className="auth-modern-title">{isLogin ? 'Welcome back' : 'Create account'}</h1>
              <p className="auth-modern-subtitle">
                {isLogin
                  ? "Sign in to continue your journey"
                  : 'Join us today and get started'}
              </p>
            </div>

            {/* Auth form */}
            <form onSubmit={handleSubmit} className="auth-modern-form">
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  className="modern-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label="Email address"
                />
              </div>

              <div className="input-group password-group">
                <label className="input-label">Password</label>
                <div className="password-input-container">
                  <input
                    className="modern-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9629 12 20C5 20 1 12 1 12C2.24347 9.6263 3.96673 7.54704 6.05991 5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9.9 4.24C10.5883 4.07888 11.2931 3.99834 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14.12 14.12C13.8454 14.4147 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2219 9.18488 10.8539C9.34884 10.4859 9.58525 10.1546 9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="input-group">
                  <label className="input-label">Role</label>
                  <select 
                    className="modern-input"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="sme">Small Business Owner</option>
                    <option value="vendor">Vendor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              )}

              {isLogin && (
                <div className="auth-modern-forgot">
                  <a href="#" className="forgot-link">Forgot password?</a>
                </div>
              )}

              <button className="modern-button" type="submit" disabled={loading}>
                {loading ? (
                  <div className="button-loader">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Toggle between login/signup */}
            <div className="auth-modern-toggle">
              <p>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="toggle-link"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast container */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
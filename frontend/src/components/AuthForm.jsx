// frontend/src/components/AuthForm.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('sme');
  const { signIn, signUp, getAndSetSession } = useAuth();

  const styles = {
    page: {
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'var(--font-sans)',
      backgroundColor: '#0B0E1B',
    },
    formPanel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px',
      backgroundColor: 'var(--bg-secondary)',
    },
    graphicPanel: {
      flex: 1.5,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '60px',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      color: 'white',
    },
    form: {
      maxWidth: '400px',
      width: '100%',
    },
    title: {
      color: 'var(--text-primary)',
      fontSize: '2.5rem',
      fontWeight: '800',
      marginBottom: '12px',
    },
    subtitle: {
      color: 'var(--text-secondary)',
      fontSize: '1rem',
      marginBottom: '40px',
    },
    input: {
      width: '100%',
      padding: '16px',
      fontSize: '1rem',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      marginBottom: '20px',
    },
    button: {
      width: '100%',
      padding: '16px',
      fontSize: '1rem',
      fontWeight: '600',
      color: '#FFF',
      backgroundColor: 'var(--primary-accent)',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
    },
    graphicTitle: {
      fontSize: '3rem',
      fontWeight: '800',
      lineHeight: 1.2,
      marginBottom: '24px',
    },
    graphicText: {
      fontSize: '1.1rem',
      color: '#cbd5e1',
      maxWidth: '500px',
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const handler = isLogin ? signIn : signUp;
    const { data: authData, error } = await handler(email, password);

    if (error) {
      alert(`Error: ${error.message}`);
    } else if (isLogin) {
      if (authData.session) {
        await getAndSetSession();
        window.location.href = '/dashboard';
      }
    } else {
      if (authData.user) {
        try {
          await axios.post(`${API_URL}/api/admin/set-user-role`, { user_id: authData.user.id, role: selectedRole });
          alert(`Success! Please check your email to verify your account, then you can sign in.`);
          setIsLogin(true);
        } catch (e) {
          alert("Registration failed. Please try again.");
        }
      }
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.graphicPanel}>
        <h1 style={styles.graphicTitle}>Comprehensive Security at your Fingertips.</h1>
        <p style={styles.graphicText}>CSaaS provides real-time threat monitoring, vendor risk assessment, and automated compliance reporting in a unified, intuitive platform.</p>
      </div>
      <div style={styles.formPanel}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={styles.subtitle}>{isLogin ? 'Sign in to access your dashboard.' : 'Get started with CSaaS.'}</p>
          <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required />
          <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
          {!isLogin && (
            <select style={styles.input} value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
              <option value="sme">SME User</option>
              <option value="auditor">Auditor</option>
            </select>
          )}
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)' }}>
            {isLogin ? "No account? " : "Already registered? "}
            <span onClick={() => setIsLogin(!isLogin)} style={{ cursor: 'pointer', color: 'var(--primary-accent)', fontWeight: '600' }}>
              {isLogin ? 'Create one' : 'Sign In'}
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
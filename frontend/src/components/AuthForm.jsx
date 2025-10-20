// frontend/src/components/AuthForm.jsx (Cleaned Up & Debugged)

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios'; 

const API_URL = import.meta.env.VITE_API_URL;

const colors = {
    primary: '#007AFF',
    text: '#333',
    secondary: '#6C757D'
};

const styles = {
    // Relying on CSS for full height/centering. Only inner flex is needed here.
    container: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        fontFamily: 'Roboto, sans-serif'
    },
    form: { 
        backgroundColor: 'white', 
        padding: '50px', 
        borderRadius: '20px', 
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)', 
        maxWidth: '450px', 
        width: '100%',
        zIndex: 10,
        position: 'relative', 
    },
    title: { 
        textAlign: 'center', 
        marginBottom: '35px', 
        color: colors.primary, 
        fontSize: '2.2rem', 
        fontWeight: '700',
        letterSpacing: '0.5px'
    },
    input: { 
        width: '100%', 
        padding: '16px', 
        boxSizing: 'border-box', 
        borderRadius: '12px', 
        border: '1px solid #E0E4E8', 
        marginBottom: '20px',
        fontSize: '1rem',
        color: colors.text,
    },
    select: { // STYLE FOR SELECT BOX
        width: '100%', 
        padding: '14px', 
        boxSizing: 'border-box', 
        borderRadius: '12px', 
        border: '1px solid #E0E4E8', 
        marginBottom: '20px',
        fontSize: '1rem',
        color: colors.text,
        backgroundColor: 'white'
    },
    button: (isPrimary) => ({ 
        width: '100%', 
        padding: '16px', 
        marginTop: isPrimary ? '0' : '15px',
        backgroundColor: isPrimary ? colors.primary : colors.secondary,
        color: 'white', 
        border: 'none', 
        borderRadius: '12px', 
        cursor: 'pointer',
        fontSize: '1.1rem',
        fontWeight: '600',
    }),
    switchText: {
        textAlign: 'center',
        marginTop: '25px',
        color: colors.secondary
    }
};

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('sme');
  const { signIn, signUp, getAndSetSession } = useAuth(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const handler = isLogin ? signIn : signUp;
    
    const { data: authData, error } = await handler(email, password);

    if (error) {
      setLoading(false);
      alert(`Authentication Error: ${error.message}`);
      return;
    } 

    if (isLogin) {
        if (authData.session) {
            await getAndSetSession();
            window.location.href = '/dashboard'; 
        }
    } else {
        if (authData.user) {
            try {
                await axios.post(`${API_URL}/api/admin/set-user-role`, {
                    user_id: authData.user.id,
                    role: selectedRole
                });
                alert(`Registration successful! Role set to ${selectedRole}. You can now log in.`);

            } catch (e) {
                console.error("Failed to set user role via API:", e.response?.data?.detail || e.message);
                alert("Registration complete, but failed to set user role. Defaulting to SME.");
            }
        }
        setIsLogin(true); 
    }
    setLoading(false);
  };

  return (
    // CRITICAL: Ensure className is applied to the container
    <div style={styles.container} className="auth-container-with-gradient">
        {/* Mesh gradient blobs defined in App.css */}
        <div className="mesh-blob mesh-blob-1"></div>
        <div className="mesh-blob mesh-blob-2"></div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
            <h2 style={styles.title}>{isLogin ? 'Sign In to CSaaS' : 'Register for CSaaS'}</h2>
            <div>
                <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Work Email" required />
            </div>
            <div>
                <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
            </div>
            
            {!isLogin && (
                <div style={{ marginBottom: '20px' }}>
                    <select 
                        style={styles.select}
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                    >
                        <option value="sme">SME User</option>
                        <option value="auditor">Auditor</option>
                    </select>
                </div>
            )}

            <button type="submit" style={styles.button(true)} disabled={loading}>
                {loading ? 'Verifying...' : (isLogin ? 'Secure Sign In' : 'Create Account')}
            </button>
            <p style={styles.switchText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span onClick={() => setIsLogin(!isLogin)} style={{cursor: 'pointer', color: colors.primary, fontWeight: '600'}}>
                    {isLogin ? 'Register Here' : 'Sign In'}
                </span>
            </p>
        </form>
    </div>
  );
}
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const colors = {
    primary: '#007AFF',
    text: '#333',
    secondary: '#6C757D'
};

const styles = {
    // Container style is now simplified, relying on the CSS class for background/gradient
    container: { 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        fontFamily: 'Roboto, sans-serif'
    },
    // The login box itself is visually enhanced
    form: { 
        backgroundColor: 'white', 
        padding: '50px', 
        borderRadius: '20px', // Slightly more rounded
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)', // More pronounced but still clean shadow
        maxWidth: '450px', // Slightly wider login box
        width: '100%',
        zIndex: 10, // Ensure form is above the mesh blobs
        position: 'relative', // Necessary for zIndex
    },
    title: { 
        textAlign: 'center', 
        marginBottom: '35px', 
        color: colors.primary, 
        fontSize: '2.2rem', // Larger title
        fontWeight: '700',
        letterSpacing: '0.5px'
    },
    input: { 
        width: '100%', 
        padding: '16px', // Larger inputs
        boxSizing: 'border-box', 
        borderRadius: '12px', // More rounded inputs
        border: '1px solid #E0E4E8', 
        marginBottom: '20px',
        fontSize: '1rem',
        color: colors.text,
        transition: 'border-color 0.3s, box-shadow 0.3s',
        // Classy focus effect
        '&:focus': {
            borderColor: colors.primary,
            boxShadow: `0 0 0 3px ${colors.primary}30`,
            outline: 'none'
        }
    },
    button: (isPrimary) => ({ 
        width: '100%', 
        padding: '16px', // Larger buttons
        marginTop: isPrimary ? '0' : '15px',
        backgroundColor: isPrimary ? colors.primary : colors.secondary,
        color: 'white', 
        border: 'none', 
        borderRadius: '12px', 
        cursor: 'pointer',
        fontSize: '1.1rem',
        fontWeight: '600',
        transition: 'background-color 0.3s, box-shadow 0.3s',
        // Hover effect for a "cool" feel
        '&:hover': {
            backgroundColor: isPrimary ? '#005bb5' : '#5a6268',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        }
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
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const handler = isLogin ? signIn : signUp;
    
    const { error } = await handler(email, password);

    setLoading(false);

    if (error) {
      alert(`Authentication Error: ${error.message}`);
    } else {
        if (isLogin) {
            navigate('/dashboard');
        } else {
            alert('Registration successful! Check your email for confirmation.');
            setIsLogin(true); 
        }
    }
  };

  return (
    // Apply the CSS class for the gradient background
    <div style={styles.container} className="auth-container-with-gradient">
        {/* Render the mesh gradient blobs (defined in CSS) */}
        <div className="mesh-blob mesh-blob-1"></div>
        <div className="mesh-blob mesh-blob-2"></div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
            <h2 style={styles.title}>{isLogin ? 'Sign In to CSaaS' : 'Register for CSaaS'}</h2>
            <div>
                <input style={styles.input} 
                       type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Work Email" required />
            </div>
            <div>
                <input style={styles.input} 
                       type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
            </div>
            <button type="submit" style={styles.button(true)} disabled={loading}>
                {loading ? 'Processing...' : (isLogin ? 'Secure Sign In' : 'Create Account')}
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
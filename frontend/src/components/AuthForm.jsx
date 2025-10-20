import { useState } from 'react';
// useEffect removed as the core logic is now in the getAndSetSession call
import { useAuth } from '../context/AuthContext';

const colors = {
    primary: '#007AFF',
    text: '#333',
    secondary: '#6C757D'
};

const styles = {
    container: { 
        minHeight: '100vh', 
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
        transition: 'border-color 0.3s, box-shadow 0.3s',
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
        transition: 'background-color 0.3s, box-shadow 0.3s',
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
  // NEW: getAndSetSession is destructured here
  const { signIn, signUp, getAndSetSession } = useAuth(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const handler = isLogin ? signIn : signUp;
    
    const { data: authData, error } = await handler(email, password);

    setLoading(false);

    if (error) {
      alert(`Authentication Error: ${error.message}`);
    } else {
        if (isLogin) {
            // CRITICAL FIX: After successful login (authData.session exists),
            // manually force the AuthContext state update BEFORE navigating.
            if (authData.session) {
                await getAndSetSession(); // Forces the AuthContext to update session=active
                window.location.href = '/dashboard'; // Now navigation works
            }
        } else {
            alert('Registration successful! Check your email for confirmation.');
            setIsLogin(true); 
        }
    }
  };

  return (
    <div style={styles.container} className="auth-container-with-gradient">
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
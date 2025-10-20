import { createContext, useContext, useState, useEffect } from 'react';
// Import the Supabase client from its isolated file (Fixes HMR/Vite error)
import { supabase } from '../supabaseClient.js'; 

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to manually check and set the session state
  const getAndSetSession = async () => {
    setLoading(true);
    const { data: { session: newSession } } = await supabase.auth.getSession();
    setSession(newSession);
    setUser(newSession?.user ?? null);
    setLoading(false);
    return newSession;
  };

  // Function to refresh session without affecting loading state
  const refreshSessionSilently = async () => {
    const { data: { session: newSession } } = await supabase.auth.getSession();
    setSession(newSession);
    setUser(newSession?.user ?? null);
    return newSession;
  };

  useEffect(() => {
    // 1. Initial Check: Must run getAndSetSession once to know the initial auth state
    getAndSetSession();

    // 2. Set up the session change listener (for signout/refresh events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) setLoading(false); 
      }
    );

    // 3. Clean up the listener
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);
  
  // CRITICAL FIX: Effect to check URL Hash for a token on every load
  useEffect(() => {
    const hash = window.location.hash;
    
    // Check if the hash contains the access_token (set by AuthForm on successful login)
    if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('access_token');
        
        if (token) {
            // Set the session using the retrieved token
            supabase.auth.setSession({ access_token: token, refresh_token: null })
                .then(() => {
                    // Clean the URL hash to remove the token
                    window.history.replaceState(null, '', window.location.pathname);
                    // Force the AuthContext to recognize the new session immediately
                    getAndSetSession();
                })
                .catch(e => console.error("Error setting session from URL hash:", e));
        }
    }
  }, []); // Run only on initial mount

  const value = {
    session,
    user,
    loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signOut: () => {
      supabase.auth.signOut().then(() => window.location.href = '/');
    },
    getAndSetSession,
    // Use silent refresh to avoid loading state issues
    refreshSession: async () => {
      await refreshSessionSilently();
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
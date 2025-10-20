import { createContext, useContext, useState, useEffect } from 'react';
// Import the Supabase client from its isolated file (Fixes HMR/Vite error)
import { supabase } from '../supabaseClient'; 

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to manually check and set the session state
  const getAndSetSession = async () => {
    setLoading(true);
    // Core function to read the token from local storage and set state
    const { data: { session: newSession } } = await supabase.auth.getSession();
    setSession(newSession);
    setUser(newSession?.user ?? null);
    setLoading(false);
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
        // Only set loading=false if a signout event occurs and the state is null
        if (!session) setLoading(false); 
      }
    );

    // 3. Cleanup the listener
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    loading,
    // Core Auth Methods
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signOut: () => {
      // Use hard refresh on signout to clear all state reliably
      supabase.auth.signOut().then(() => window.location.href = '/');
    },
    // Expose the manual setter for use in AuthForm (the final navigation fix)
    getAndSetSession, 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
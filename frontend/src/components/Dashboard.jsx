import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const colors = {
    primary: '#007AFF', // Blue
    success: '#28A745', // Green
    warning: '#FFC107', // Yellow
    danger: '#DC3545',  // Red
    text: '#333',
    lightBg: '#F5F7FA',
    sidebarBg: '#FFFFFF', 
    secondary: '#6C757D'
}

const styles = {
    // --- Overall Page Layout ---
    appLayout: { display: 'flex', minHeight: '100vh', fontFamily: 'Roboto, sans-serif' },
    // --- Sidebar (Left Navigation/Status) ---
    sidebar: { 
        width: '280px', minWidth: '280px', backgroundColor: colors.sidebarBg, padding: '30px', boxShadow: '2px 0 10px rgba(0, 0, 0, 0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    },
    sidebarHeader: { fontSize: '1.5rem', fontWeight: '700', color: colors.primary, marginBottom: '40px', textAlign: 'center' },
    userInfo: { padding: '15px', borderRadius: '10px', backgroundColor: colors.lightBg, marginBottom: '30px', border: `1px solid #E0E4E8` },
    userRole: { fontWeight: '700', color: colors.primary, marginTop: '8px', fontSize: '1rem' },
    logoutButton: { padding: '12px 15px', backgroundColor: colors.danger, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', width: '100%', transition: 'background-color 0.3s' },
    navItem: (isActive) => ({
        padding: '12px 15px', borderRadius: '8px', fontWeight: isActive ? '700' : '500', backgroundColor: isActive ? `${colors.primary}15` : 'transparent', color: isActive ? colors.primary : colors.secondary, cursor: 'pointer', marginBottom: '5px'
    }),
    // --- Main Content Area ---
    mainContent: { flexGrow: 1, padding: '40px', backgroundColor: colors.lightBg, overflowY: 'auto' },
    headerTitle: { color: colors.text, margin: 0, fontWeight: '700', fontSize: '2rem' },
    cardGrid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '25px', 
        marginBottom: '40px' 
    },
    card: (color) => ({ 
        padding: '25px', 
        borderRadius: '12px', 
        backgroundColor: 'white', 
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        borderLeft: `5px solid ${color}`,
    }),
    cardValue: { fontSize: '2.5rem', fontWeight: '700', color: colors.text, margin: '10px 0' },
    cardSubtext: { color: colors.secondary, fontSize: '0.9rem' },
    errorBox: { 
        color: colors.danger, 
        border: `1px solid ${colors.danger}`, 
        backgroundColor: `${colors.danger}10`, 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        fontFamily: 'monospace',
        fontSize: '0.9rem'
    },
    loadingBox: {
        color: colors.primary,
        border: `1px solid ${colors.primary}`,
        backgroundColor: `${colors.primary}10`,
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
    },
    workflowCard: {
        padding: '25px', 
        borderRadius: '12px', 
        backgroundColor: 'white', 
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        minHeight: '200px'
    },
    debugInfo: {
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px',
        fontSize: '0.8rem',
        fontFamily: 'monospace'
    }
};

export default function Dashboard() {
  const { session, user, signOut } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!session || !session.access_token) {
        console.log('No session or access token available');
        console.log('Session object:', session);
        setLoading(false);
        return;
      }
      
      console.log('=== DEBUGGING TOKEN ===');
      console.log('Full token:', session.access_token);
      console.log('Token length:', session.access_token.length);
      console.log('Token type:', typeof session.access_token);
      console.log('API URL:', API_URL);
      
      // Store debug info for display
      setDebugInfo({
        tokenPreview: session.access_token.substring(0, 20) + '...',
        tokenLength: session.access_token.length,
        apiUrl: API_URL,
        userEmail: user?.email
      });
      
      // First, test the token with debug endpoint
      try {
        console.log('Testing token with debug endpoint...');
        const debugResponse = await axios.get(`${API_URL}/api/debug/token`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
        });
        console.log('Debug response:', debugResponse.data);
        
        if (debugResponse.data.status === 'error') {
          setError(`Token validation failed: ${debugResponse.data.message}`);
          setLoading(false);
          return;
        }
        
        // Update debug info with successful validation
        setDebugInfo(prev => ({
          ...prev,
          tokenValidation: 'SUCCESS',
          userRole: debugResponse.data.user_role
        }));
        
      } catch (debugErr) {
        console.error("Debug endpoint failed:", debugErr.response?.data);
        setError(`Debug failed: ${debugErr.response?.data?.message || debugErr.message}`);
        setDebugInfo(prev => ({
          ...prev,
          tokenValidation: 'FAILED',
          debugError: debugErr.response?.data?.message || debugErr.message
        }));
        setLoading(false);
        return;
      }
      
      // If debug passes, try the actual endpoint
      try {
        setLoading(true);
        setError(null);
        
        console.log('Making API call to dashboard endpoint...');
        const response = await axios.get(`${API_URL}/api/dashboard/summary`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
        });

        console.log('API Response:', response.data);
        setDashboardData(response.data);
        setLoading(false);
        
      } catch (err) {
        console.error("Dashboard API Call Failed:", err.response ? err.response.data : err.message);
        console.error("Status code:", err.response?.status);
        console.error("Headers:", err.response?.headers);
        
        if (err.response?.status === 401) {
          setError("Authentication failed. Please log in again.");
        } else {
          setError(err.response?.data?.detail || "Failed to fetch dashboard data.");
        }
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [session, user]);

  if (loading && !dashboardData) {
    return (
      <div style={{ ...styles.appLayout, justifyContent: 'center', alignItems: 'center' }}>
        <div style={styles.loadingBox}>
          <p>Loading application data...</p>
          <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>
            {debugInfo && `Testing token: ${debugInfo.tokenPreview}`}
          </p>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div style={{ ...styles.appLayout, justifyContent: 'center', alignItems: 'center' }}>
        <div style={styles.errorBox}>
          Please log in to access the dashboard.
        </div>
      </div>
    );
  }

  const currentRole = dashboardData?.user_role?.toUpperCase() || 'LOADING...';
  const summary = dashboardData?.summary;

  return (
    <div style={styles.appLayout}>
      
      {/* 1. SIDEBAR */}
      <div style={styles.sidebar}>
        <div>
            <h2 style={styles.sidebarHeader}>CSaaS</h2>
            <div style={styles.userInfo}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: colors.text }}>
                    {user?.email}
                </p>
                <p style={styles.userRole}>
                    {currentRole}
                </p>
            </div>
            <div>
                <p style={styles.navItem(true)}>Dashboard</p>
                <p style={styles.navItem(false)}>Vendor Risk</p>
                <p style={styles.navItem(false)}>Threat Monitoring</p>
                <p style={styles.navItem(false)}>Reporting Engine</p>
            </div>
        </div>
        <button onClick={signOut} style={styles.logoutButton}>Sign Out</button>
      </div>

      {/* 2. MAIN CONTENT */}
      <div style={styles.mainContent}>
        <h1 style={styles.headerTitle}>Welcome Back, {user?.email.split('@')[0]}!</h1>
        <h2 style={{ marginBottom: '25px', color: colors.text, fontSize: '1.2rem', fontWeight: '400' }}>
            Current Security Posture Overview
        </h2>

        {/* Debug Information */}
        {debugInfo && (
          <div style={styles.debugInfo}>
            <h4 style={{ margin: '0 0 10px 0', color: colors.text }}>Debug Information:</h4>
            <p><strong>API URL:</strong> {debugInfo.apiUrl}</p>
            <p><strong>Token Preview:</strong> {debugInfo.tokenPreview}</p>
            <p><strong>Token Length:</strong> {debugInfo.tokenLength}</p>
            <p><strong>User Email:</strong> {debugInfo.userEmail}</p>
            {debugInfo.tokenValidation && (
              <p><strong>Token Validation:</strong> 
                <span style={{ color: debugInfo.tokenValidation === 'SUCCESS' ? colors.success : colors.danger }}>
                  {debugInfo.tokenValidation}
                </span>
              </p>
            )}
            {debugInfo.userRole && (
              <p><strong>User Role:</strong> {debugInfo.userRole}</p>
            )}
            {debugInfo.debugError && (
              <p><strong>Debug Error:</strong> <span style={{ color: colors.danger }}>{debugInfo.debugError}</span></p>
            )}
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <strong>API Error:</strong> {error}
          </div>
        )}
        
        {/* 2.1. SECURITY METRICS (Card Grid) */}
        <div style={styles.cardGrid}>
            
            <div style={styles.card(colors.primary)}>
                <p style={styles.cardSubtext}>Role Status (Verified by Backend)</p>
                <p style={styles.cardValue}>{currentRole}</p>
                <p style={styles.cardSubtext}>JWT validated and profile retrieved successfully.</p>
            </div>

            <div style={styles.card(colors.danger)}>
                <p style={styles.cardSubtext}>Open Alerts/Threats</p>
                <p style={styles.cardValue}>{summary?.threat_count || 'N/A'}</p>
                <p style={styles.cardSubtext}>Action Required: Review high-severity findings.</p>
            </div>

            <div style={styles.card(colors.warning)}>
                <p style={styles.cardSubtext}>Pending Vendor Reviews</p>
                <p style={styles.cardValue}>{summary?.pending_vendor_assessments || 'N/A'}</p>
                <p style={styles.cardSubtext}>{summary?.user_role_focus || 'Loading...'}</p>
            </div>

            <div style={styles.card(colors.success)}>
                <p style={styles.cardSubtext}>Overall Compliance Score</p>
                <p style={styles.cardValue}>{summary?.compliance_score || '85'}%</p>
                <p style={styles.cardSubtext}>Target: 95% - Monitor and improve.</p>
            </div>
        </div>

        {/* 2.2. WORKFLOW OVERVIEW (Two-Column Layout) */}
        <div style={{ display: 'flex', gap: '25px', marginTop: '10px' }}>
            
            {/* LEFT COLUMN: PENDING WORKFLOW ITEMS */}
            <div style={{ flex: 1 }}>
                <h3 style={{color: colors.text, marginBottom: '20px', borderBottom: '1px solid #E0E4E8', paddingBottom: '10px'}}>
                    Pending Actions
                </h3>
                <div style={styles.workflowCard}>
                     <p style={{fontWeight: '600', color: colors.text, marginBottom: '10px'}}>Vendor Risk Management</p>
                     <p style={styles.cardSubtext}>**{summary?.pending_vendor_assessments || 'N/A'}** Assessments Awaiting Review</p>
                     <p style={{fontWeight: '600', color: colors.text, marginBottom: '10px', marginTop: '20px'}}>Threat Incident Management</p>
                     <p style={styles.cardSubtext}>**{summary?.threat_count || 'N/A'}** Incidents Requiring Acknowledgment</p>
                     <p style={{marginTop: '25px', color: colors.primary, cursor: 'pointer', fontWeight: '600'}}>Go to Task Center →</p>
                </div>
            </div>

            {/* RIGHT COLUMN: REPORTING/TRAINING */}
            <div style={{ flex: 1 }}>
                <h3 style={{color: colors.text, marginBottom: '20px', borderBottom: '1px solid #E0E4E8', paddingBottom: '10px'}}>
                    Reporting & Training
                </h3>
                <div style={styles.workflowCard}>
                    <p style={{fontWeight: '600', color: colors.text, marginBottom: '10px'}}>Training Module</p>
                    <p style={styles.cardSubtext}>1 of 4 modules completed.</p>
                    <p style={{fontWeight: '600', color: colors.text, marginBottom: '10px', marginTop: '20px'}}>Generate Reports</p>
                    <p style={styles.cardSubtext}>Generate Compliance or Risk Assessment PDFs on demand.</p>
                    <p style={{marginTop: '25px', color: colors.primary, cursor: 'pointer', fontWeight: '600'}}>Go to Reporting →</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
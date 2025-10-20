import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// --- STYLES (Truncated for brevity) ---
const colors = {
    primary: '#007AFF', success: '#28A745', warning: '#FFC107', danger: '#DC3545', 
    text: '#333', lightBg: '#F5F7FA', sidebarBg: '#FFFFFF', secondary: '#6C757D'
};
const styles = {
    appLayout: { display: 'flex', minHeight: '100vh', fontFamily: 'Roboto, sans-serif' },
    sidebar: { width: '280px', minWidth: '280px', backgroundColor: colors.sidebarBg, padding: '30px', boxShadow: '2px 0 10px rgba(0, 0, 0, 0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    sidebarHeader: { fontSize: '1.5rem', fontWeight: '700', color: colors.primary, marginBottom: '40px', textAlign: 'center' },
    userInfo: { padding: '15px', borderRadius: '10px', backgroundColor: colors.lightBg, marginBottom: '30px', border: `1px solid #E0E4E8` },
    userRole: { fontWeight: '700', color: colors.primary, marginTop: '8px', fontSize: '1rem' },
    logoutButton: { padding: '12px 15px', backgroundColor: colors.danger, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', width: '100%', transition: 'background-color 0.3s' },
    navItem: (isActive) => ({ padding: '12px 15px', borderRadius: '8px', fontWeight: isActive ? '700' : '500', backgroundColor: isActive ? `${colors.primary}15` : 'transparent', color: isActive ? colors.primary : colors.secondary, cursor: 'pointer', marginBottom: '5px' }),
    mainContent: { flexGrow: 1, padding: '40px', backgroundColor: colors.lightBg, overflowY: 'auto' },
    headerTitle: { color: colors.text, margin: 0, fontWeight: '700', fontSize: '2rem' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '40px' },
    card: (color) => ({ padding: '25px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderLeft: `5px solid ${color}` }),
    cardValue: { fontSize: '2.5rem', fontWeight: '700', color: colors.text, margin: '10px 0' },
    cardSubtext: { color: colors.secondary, fontSize: '0.9rem' },
    errorBox: { color: colors.danger, border: `1px solid ${colors.danger}`, backgroundColor: `${colors.danger}10`, padding: '15px', borderRadius: '8px', marginBottom: '20px' },
    loadingBox: { color: colors.primary, border: `1px solid ${colors.primary}`, backgroundColor: `${colors.primary}10`, padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' },
    workflowCard: { padding: '25px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', minHeight: '200px' },
    button: { padding: '12px 20px', backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    input: { width: 'calc(100% - 24px)', padding: '12px', borderRadius: '8px', border: '1px solid #E0E4E8', marginBottom: '15px' },
};

// --- NEW REUSABLE COMPONENT ---
const ReportGenerator = ({ session, user }) => {
    const [reportType, setReportType] = useState('Vendor Compliance');
    const [isGenerating, setIsGenerating] = useState(false);
    const [message, setMessage] = useState('');

    const handleGenerate = async () => {
        setIsGenerating(true);
        setMessage('');
        try {
            const response = await axios.post(`${API_URL}/api/reports/generate`, 
                { report_type: reportType, user_id: user.id },
                { headers: { 'Authorization': `Bearer ${session.access_token}` } }
            );
            setMessage(`Success: ${response.data.message}. Path: ${response.data.data.file_storage_path}`);
        } catch (error) {
            setMessage(`Error: ${error.response?.data?.detail || error.message}`);
        }
        setIsGenerating(false);
    };

    return (
        <div style={styles.workflowCard}>
            <h3 style={{color: colors.text, marginBottom: '20px'}}>Generate On-Demand Reports</h3>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} style={styles.input}>
                <option>Vendor Compliance</option>
                <option>Risk Assessment</option>
            </select>
            <button onClick={handleGenerate} disabled={isGenerating} style={styles.button}>
                {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
            {message && <p style={{ marginTop: '15px', color: message.startsWith('Error') ? colors.danger : colors.success }}>{message}</p>}
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT (Updated) ---
export default function Dashboard() {
  const { session, user, signOut } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('Dashboard'); // NEW: State for navigation

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!session?.access_token) {
        setLoading(false);
        setError("Your session has expired or is invalid. Please log in again.");
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/api/dashboard/summary`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        setDashboardData(response.data);
      } catch (err) {
        console.error("Dashboard API Call Failed:", err.response || err);
        setError(err.response?.data?.detail || "Failed to fetch dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [session, user]);

  if (loading && !dashboardData) {
    return <div style={{...styles.appLayout, justifyContent: 'center', alignItems: 'center'}}><div style={styles.loadingBox}>Loading application data...</div></div>;
  }
  
  if (error && !dashboardData) {
      return <div style={{...styles.appLayout, justifyContent: 'center', alignItems: 'center'}}><div style={styles.errorBox}><strong>Error:</strong> {error}</div></div>
  }

  if (!session) {
    return <div style={{...styles.appLayout, justifyContent: 'center', alignItems: 'center'}}><div style={styles.errorBox}>Please log in to access the dashboard.</div></div>;
  }

  const currentRole = dashboardData?.user_role?.toUpperCase() || 'LOADING...';
  const summary = dashboardData?.summary;

  const renderActiveView = () => {
      switch (activeView) {
          case 'Reporting Engine':
              return <ReportGenerator session={session} user={user} />;
          case 'Dashboard':
          default:
              return (
                  <>
                      <div style={styles.cardGrid}>
                          <div style={styles.card(colors.primary)}>
                              <p style={styles.cardSubtext}>Role Status (Verified by Backend)</p>
                              <p style={styles.cardValue}>{currentRole}</p>
                          </div>
                          <div style={styles.card(colors.danger)}>
                              <p style={styles.cardSubtext}>Open Incident Tickets</p>
                              <p style={styles.cardValue}>{summary?.threat_count ?? 'N/A'}</p>
                          </div>
                          <div style={styles.card(colors.warning)}>
                              <p style={styles.cardSubtext}>Pending Vendor Reviews</p>
                              <p style={styles.cardValue}>{summary?.pending_vendor_assessments ?? 'N/A'}</p>
                          </div>
                          <div style={styles.card(colors.success)}>
                              <p style={styles.cardSubtext}>Overall Compliance Score</p>
                              <p style={styles.cardValue}>{summary?.compliance_score ?? 'N/A'}%</p>
                          </div>
                      </div>
                      <p style={styles.cardSubtext}>{summary?.user_role_focus}</p>
                  </>
              );
      }
  };

  return (
    <div style={styles.appLayout}>
      <div style={styles.sidebar}>
        <div>
            <h2 style={styles.sidebarHeader}>CSaaS</h2>
            <div style={styles.userInfo}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{user?.email}</p>
                <p style={styles.userRole}>{currentRole}</p>
            </div>
            <div>
                {['Dashboard', 'Reporting Engine'].map(view => (
                    <p key={view} style={styles.navItem(activeView === view)} onClick={() => setActiveView(view)}>
                        {view}
                    </p>
                ))}
            </div>
        </div>
        <button onClick={signOut} style={styles.logoutButton}>Sign Out</button>
      </div>

      <div style={styles.mainContent}>
        <h1 style={styles.headerTitle}>Welcome Back, {user?.email?.split('@')[0]}!</h1>
        <h2 style={{ marginBottom: '25px', color: colors.text, fontSize: '1.2rem', fontWeight: '400' }}>
            {activeView === 'Dashboard' ? 'Current Security Posture Overview' : activeView}
        </h2>
        {error && <div style={styles.errorBox}><strong>API Error:</strong> {error}</div>}
        {renderActiveView()}
      </div>
    </div>
  );
}
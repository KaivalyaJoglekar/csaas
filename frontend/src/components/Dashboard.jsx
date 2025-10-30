// frontend/src/components/Dashboard.jsx

import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../App';
import './Dashboard.css'; // This will be the new CSS file

const API_URL = import.meta.env.VITE_API_URL;

// --- ICON COMPONENTS ---
const Icon = ({ path, size = 20 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    style={{ width: size, height: size, flexShrink: 0 }}
  >
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

const Icons = { 
  Dashboard: <Icon path="M9 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 6a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM6 15a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zM11 4a1 1 0 100 2h1a1 1 0 100-2h-1zM13 9a1 1 0 100 2h1a1 1 0 100-2h-1zM15 13a1 1 0 100 2h1a1 1 0 100-2h-1z" />, 
  Shield: <Icon path="M9 1.06c.278-.26.64-.423 1.03-.497C11.536.495 12.87.822 14 1.765c1.554 1.282 2.22 3.422 2.22 5.235 0 1.83-1.04 4.53-2.33 6.136a13.387 13.387 0 01-3.235 3.39c-.588.46-1.462.46-2.05 0a13.387 13.387 0 01-3.236-3.39C3.26 12.53 2.22 9.83 2.22 8c0-1.813.666-3.953 2.22-5.235C5.553.822 6.887.495 8.384.563 8.774.586 9.136.73 9.414 1.06zM10 8a2 2 0 100-4 2 2 0 000 4z" />, 
  Alert: <Icon path="M8.257 3.099c.725-1.26 2.76-1.26 3.486 0l5.58 9.667c.726 1.26-.27 2.86-1.742 2.86H4.42c-1.472 0-2.468-1.6-1.743-2.86l5.58-9.667zM9 8a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM10 14a1 1 0 100-2 1 1 0 000 2z" />, 
  Calendar: <Icon path="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z M8 6a1 1 0 000 2h2a1 1 0 100-2H8z M8 10a1 1 0 000 2h2a1 1 0 100-2H8z M8 14a1 1 0 000 2h2a1 1 0 100-2H8z M8 18a1 1 0 000 2h2a1 1 0 100-2H8z M4 4a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v2H4V6zm0 4h12v2H4v-2zm0 4h12v2H4v-2zm0 4h12v2H4v-2z" />,
  Scan: <Icon path="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />,
  Report: <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  Analytics: <Icon path="M3 13.125C3 12.504 3.504 12 4.125 12h1.75c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-1.75C3.504 18 3 17.496 3 16.875v-3.75zM9.875 8.625c0-.621.504-1.125 1.125-1.125h1.75c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-1.75c-.621 0-1.125-.504-1.125-1.125v-8.25zM16.625 4.125c0-.621.504-1.125 1.125-1.125h1.75c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125h-1.75c-.621 0-1.125-.504-1.125-1.125V4.125z" />,
  Settings: <Icon path="M10 5a1 1 0 011 1v3a1 1 0 11-2 0V6a1 1 0 011-1zM10 12a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zM4 8a1 1 0 011 1v3a1 1 0 11-2 0V9a1 1 0 011-1zM16 8a1 1 0 011 1v3a1 1 0 11-2 0V9a1 1 0 011-1zM1.172 10.828a1 1 0 010-1.414l2-2a1 1 0 011.414 1.414l-2 2a1 1 0 01-1.414 0zM15.414 6.586a1 1 0 010 1.414l-2 2a1 1 0 11-1.414-1.414l2-2a1 1 0 011.414 0zM1.172 9.172a1 1 0 011.414 0l2 2a1 1 0 01-1.414 1.414l-2-2a1 1 0 010-1.414zM15.414 13.414a1 1 0 011.414 0l2 2a1 1 0 01-1.414 1.414l-2-2a1 1 0 010-1.414z" />,
  // New icons from target image
  Search: <Icon path="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />,
  Bell: <Icon path="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
};

// --- CALENDAR COMPONENT ---
// No changes to this component, but it will be restyled by the new CSS
const Calendar = () => {
  const [currentDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <h3>Today</h3>
        <div className="calendar-icon">
          {Icons.Calendar}
        </div>
      </div>
      <div className="calendar-date">
        {formatDate(currentDate)}
      </div>
      <div className="calendar-time">
        {formatTime(time)}
      </div>
    </div>
  );
};

export default function Dashboard() {
    const { session, user, signOut } = useAuth();
    // We remove theme toggling, as the target design has a single, fixed theme
    // const { toggleTheme, themeMode } = useContext(ThemeContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // We remove the popover state and refs, as the profile is always visible now
    // const [isProfileOpen, setProfileOpen] = useState(false);
    // const profileRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!session) { setLoading(false); return; }
            try {
                const response = await axios.get(`${API_URL}/api/dashboard/summary`, { headers: { 'Authorization': `Bearer ${session.access_token}` }});
                setData(response.data);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, [session]);

    if (loading) return <div className="loader-container"><div className="loader-spinner"></div></div>;
    
    // Get user's first name for the greeting
    const userName = user?.email?.split('@')[0] || 'User';

    return (
        // The main layout is now a simple flex container
        <div className="dashboard-target-layout">
            
            {/* --- NEW DARK SIDEBAR --- */}
            <aside className="dashboard-target-sidebar">
                <div>
                    <div className="dashboard-target-logo">CSaaS Corp.</div>
                    <nav className="dashboard-target-nav">
                        <a href="/dashboard" className="dashboard-target-nav-link active">
                            {Icons.Dashboard}
                            <span>Dashboard</span>
                        </a>
                        <a href="/scanner" className="dashboard-target-nav-link">
                            {Icons.Scan}
                            <span>Scanner</span>
                        </a>
                        <a href="/reports" className="dashboard-target-nav-link">
                            {Icons.Report}
                            <span>Reports</span>
                        </a>
                        <a href="#" className="dashboard-target-nav-link">
                            {Icons.Shield}
                            <span>Vendors</span>
                        </a>
                        <a href="#" className="dashboard-target-nav-link">
                            {Icons.Alert}
                            <span>Alerts</span>
                        </a>
                         <a href="#" className="dashboard-target-nav-link">
                            {Icons.Analytics}
                            <span>Analytics</span>
                        </a>
                        <a href="#" className="dashboard-target-nav-link">
                            {Icons.Settings}
                            <span>Settings</span>
                        </a>
                    </nav>
                </div>

                {/* --- NEW SIDEBAR FOOTER --- */}
                <div className="dashboard-target-sidebar-footer">
                    <div className="ai-card">
                        <p className="ai-card-title">AI for Results Analytics</p>
                        <a href="#" className="ai-card-link">Try Now &gt;</a>
                    </div>
                    <div className="user-profile">
                        <img 
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`} 
                            alt="avatar" 
                            className="user-profile-avatar"
                        />
                        <div className="user-profile-details">
                            <p className="user-profile-name">{user?.email}</p>
                            <p className="user-profile-title">{data?.user_role || 'SME User'}</p>
                        </div>
                        {/* Sign Out Button (optional, can be added here) */}
                        {/* <button onClick={signOut} className="sign-out-button">Sign Out</button> */}
                    </div>
                </div>
            </aside>
            
            {/* --- NEW MAIN CONTENT AREA --- */}
            <main className="dashboard-target-main">
                
                {/* --- NEW HEADER --- */}
                <div className="dashboard-target-header">
                    <h1 className="dashboard-target-title">Hello, {userName}</h1>
                    <div className="header-icons">
                        <button className="header-icon-btn">{Icons.Search}</button>
                        <button className="header-icon-btn">{Icons.Bell}</button>
                        <button onClick={signOut} className="header-signout-btn">Sign Out</button>
                    </div>
                </div>
                
                {/* --- RE-STYLED GRID --- */}
                {/* We use your original grid content, but apply the new card styles */}
                <div className="dashboard-target-grid">
                    
                    {/* Your "Posture Overview" card, styled like the "Helen" card (large) */}
                    <div className="dashboard-target-card main-card">
                        <h3 className="dashboard-target-card-title">Posture Overview</h3>
                        <div className="dashboard-target-graph-placeholder">
                            [Main Graph Placeholder]
                        </div>
                    </div>
                    
                    {/* Your "Recent Activity" card, styled like the "Onboarding Tasks" card */}
                    <div className="dashboard-target-card activity-card">
                        <h3 className="dashboard-target-card-title">Recent Activity</h3>
                        <div className="dashboard-target-activity-list">
                            <div className="dashboard-target-activity-item">
                                <div className="dashboard-target-activity-content">
                                    <p className="dashboard-target-activity-text">New vulnerability detected</p>
                                    <p className="dashboard-target-activity-time">2 hours ago</p>
                                </div>
                                <div className="dashboard-target-activity-icon">🔔</div>
                            </div>
                            <div className="dashboard-target-activity-item">
                                <div className="dashboard-target-activity-content">
                                    <p className="dashboard-target-activity-text">Vendor assessment completed</p>
                                    <p className="dashboard-target-activity-time">5 hours ago</p>
                                </div>
                                <div className="dashboard-target-activity-icon">✅</div>
                            </div>
                            <div className="dashboard-target-activity-item">
                                <div className="dashboard-target-activity-content">
                                    <p className="dashboard-target-activity-text">Monthly report generated</p>
                                    <p className="dashboard-target-activity-time">1 day ago</p>
                                </div>
                                <div className="dashboard-target-activity-icon">📊</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Your Calendar, styled like the "Working Format" card */}
                    <div className="dashboard-target-card">
                        <Calendar />
                    </div>

                    {/* Your "Open Threats" card, styled like the bottom stat cards */}
                    <div className="dashboard-target-card">
                        <h3 className="dashboard-target-card-title">Open Threats</h3>
                        <p className="dashboard-target-metric-value danger">
                            {data?.summary?.threat_count ?? 'N/A'}
                        </p>
                    </div>
                    
                    {/* Your "Pending Reviews" card, styled like the bottom stat cards */}
                    <div className="dashboard-target-card">
                        <h3 className="dashboard-target-card-title">Pending Reviews</h3>
                        <p className="dashboard-target-metric-value">
                            {data?.summary?.pending_vendor_assessments ?? 'N/A'}
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
}
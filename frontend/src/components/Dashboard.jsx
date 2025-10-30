// frontend/src/components/Dashboard.jsx

import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../App';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

// --- ICON COMPONENTS ---
const Icon = ({ path, size = 20 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    style={{ width: size, height: size }}
  >
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

const Icons = { 
  Dashboard: <Icon path="M9 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 6a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM6 15a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zM11 4a1 1 0 100 2h1a1 1 0 100-2h-1zM13 9a1 1 0 100 2h1a1 1 0 100-2h-1zM15 13a1 1 0 100 2h1a1 1 0 100-2h-1z" />, 
  Shield: <Icon path="M9 1.06c.278-.26.64-.423 1.03-.497C11.536.495 12.87.822 14 1.765c1.554 1.282 2.22 3.422 2.22 5.235 0 1.83-1.04 4.53-2.33 6.136a13.387 13.387 0 01-3.235 3.39c-.588.46-1.462.46-2.05 0a13.387 13.387 0 01-3.236-3.39C3.26 12.53 2.22 9.83 2.22 8c0-1.813.666-3.953 2.22-5.235C5.553.822 6.887.495 8.384.563 8.774.586 9.136.73 9.414 1.06zM10 8a2 2 0 100-4 2 2 0 000 4z" />, 
  Alert: <Icon path="M8.257 3.099c.725-1.26 2.76-1.26 3.486 0l5.58 9.667c.726 1.26-.27 2.86-1.742 2.86H4.42c-1.472 0-2.468-1.6-1.743-2.86l5.58-9.667zM9 8a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM10 14a1 1 0 100-2 1 1 0 000 2z" />, 
  Sun: <Icon path="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.225 5.636a1 1 0 011.414-1.414l.707.707a1 1 0 01-1.414 1.414l-.707-.707zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM4.225 14.364a1 1 0 011.414 1.414l.707-.707a1 1 0 01-1.414-1.414l-.707.707zM10 18a1 1 0 011-1h.01a1 1 0 110 2H11a1 1 0 01-1-1zM15.775 5.636a1 1 0 011.414 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707zM18 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM15.775 14.364a1 1 0 011.414-1.414l-.707-.707a1 1 0 011.414 1.414l.707.707z" />, 
  Moon: <Icon path="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />,
  Calendar: <Icon path="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z M8 6a1 1 0 000 2h2a1 1 0 100-2H8z M8 10a1 1 0 000 2h2a1 1 0 100-2H8z M8 14a1 1 0 000 2h2a1 1 0 100-2H8z M8 18a1 1 0 000 2h2a1 1 0 100-2H8z M4 4a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v2H4V6zm0 4h12v2H4v-2zm0 4h12v2H4v-2zm0 4h12v2H4v-2z" />,
  Scan: <Icon path="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />,
  Report: <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
};

// --- NEW PROFILE POPOVER COMPONENT ---
const ProfilePopover = ({ user, onSignOut }) => (
  <div className="dashboard-popover">
    <div className="dashboard-popover-section">
      <p className="dashboard-popover-email">{user?.email}</p>
    </div>
    <div className="dashboard-popover-section">
      <button onClick={onSignOut} className="dashboard-popover-signout">Sign Out</button>
    </div>
  </div>
);

// --- CALENDAR COMPONENT ---
const Calendar = () => {
  const [currentDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format time
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
    const { toggleTheme, themeMode } = useContext(ThemeContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProfileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [profileRef]);

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
    
    return (
        <div className="dashboard-modern-bg">
            {/* Animated background elements */}
            <div className="dashboard-modern-bg-elements">
                <div className="dashboard-modern-bg-element bg-element-1"></div>
                <div className="dashboard-modern-bg-element bg-element-2"></div>
                <div className="dashboard-modern-bg-element bg-element-3"></div>
            </div>
            
            <div className="dashboard-modern-layout">
                <aside className="dashboard-modern-sidebar">
                    <div>
                        <div className="dashboard-modern-logo">C</div>
                        <nav className="dashboard-modern-nav">
                            <a href="/dashboard" className="dashboard-modern-nav-link active">{Icons.Dashboard}</a>
                            <a href="/scanner" className="dashboard-modern-nav-link">{Icons.Scan}</a>
                            <a href="/reports" className="dashboard-modern-nav-link">{Icons.Report}</a>
                            <a href="#" className="dashboard-modern-nav-link">{Icons.Shield}</a>
                            <a href="#" className="dashboard-modern-nav-link">{Icons.Alert}</a>
                        </nav>
                    </div>
                    <div className="dashboard-modern-sidebar-footer" ref={profileRef}>
                        <button onClick={toggleTheme} className="dashboard-modern-nav-link">
                          {themeMode === 'light' ? Icons.Moon : Icons.Sun}
                        </button>
                        <button onClick={() => setProfileOpen(p => !p)} className="dashboard-modern-avatar-button">
                            <img 
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`} 
                              alt="avatar" 
                              className="dashboard-modern-avatar"
                            />
                        </button>
                        {isProfileOpen && <ProfilePopover user={user} onSignOut={signOut} />}
                    </div>
                </aside>
                <main className="dashboard-modern-main">
                    <div className="dashboard-modern-header">
                        <h1 className="dashboard-modern-title">Dashboard</h1>
                        <Calendar />
                    </div>
                    <div className="dashboard-modern-grid">
                        <div className="dashboard-modern-card main-card">
                            <h3 className="dashboard-modern-card-title">Posture Overview</h3>
                            <div className="dashboard-modern-graph-placeholder">
                              [Main Graph Placeholder]
                            </div>
                        </div>
                        <div className="dashboard-modern-card">
                            <h3 className="dashboard-modern-card-title">Open Threats</h3>
                            <p className="dashboard-modern-metric-value danger">
                              {data?.summary?.threat_count ?? 'N/A'}
                            </p>
                        </div>
                        <div className="dashboard-modern-card">
                            <h3 className="dashboard-modern-card-title">Pending Reviews</h3>
                            <p className="dashboard-modern-metric-value">
                              {data?.summary?.pending_vendor_assessments ?? 'N/A'}
                            </p>
                        </div>
                        <div className="dashboard-modern-card">
                            <h3 className="dashboard-modern-card-title">Recent Activity</h3>
                            <div className="dashboard-modern-activity-list">
                              <div className="dashboard-modern-activity-item">
                                <div className="dashboard-modern-activity-icon">🔔</div>
                                <div className="dashboard-modern-activity-content">
                                  <p className="dashboard-modern-activity-text">New vulnerability detected</p>
                                  <p className="dashboard-modern-activity-time">2 hours ago</p>
                                </div>
                              </div>
                              <div className="dashboard-modern-activity-item">
                                <div className="dashboard-modern-activity-icon">✅</div>
                                <div className="dashboard-modern-activity-content">
                                  <p className="dashboard-modern-activity-text">Vendor assessment completed</p>
                                  <p className="dashboard-modern-activity-time">5 hours ago</p>
                                </div>
                              </div>
                              <div className="dashboard-modern-activity-item">
                                <div className="dashboard-modern-activity-icon">📊</div>
                                <div className="dashboard-modern-activity-content">
                                  <p className="dashboard-modern-activity-text">Monthly report generated</p>
                                  <p className="dashboard-modern-activity-time">1 day ago</p>
                                </div>
                              </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
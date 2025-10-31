import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

const Calendar = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);
  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div>
      <h3 className="dashboard-card-title">Today</h3>
      <p className="calendar-date">{formatDate(time)}</p>
      <p className="calendar-time">{formatTime(time)}</p>
    </div>
  );
};

export default function Dashboard() {
  const { session, user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session) { setLoading(false); return; }
      try {
        const response = await axios.get(`${API_URL}/api/dashboard/summary`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        setSummary(response.data.summary);
      } catch (err) { console.error("Failed to fetch dashboard summary:", err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [session]);

  const userName = user?.email?.split('@')[0] || 'User';

  if (loading) return <div className="loader-container"><div className="loader-spinner"></div></div>;

  return (
    <div>
      <h1 className="page-header">Hello, {userName}</h1>
      <div className="dashboard-grid">
        <div className="content-card main-card">
          <h3 className="dashboard-card-title">Posture Overview</h3>
          <div className="graph-placeholder"><span>Security Posture Trend Data</span></div>
        </div>
        <div className="content-card activity-card">
          <h3 className="dashboard-card-title">Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div>
                <p className="activity-text">New vulnerability detected</p><p className="activity-time">2 hours ago</p>
              </div>
              <div className="activity-icon">🔔</div>
            </div>
            <div className="activity-item">
              <div>
                <p className="activity-text">Vendor assessment completed</p><p className="activity-time">5 hours ago</p>
              </div>
              <div className="activity-icon">✅</div>
            </div>
            <div className="activity-item">
               <div>
                <p className="activity-text">Monthly report generated</p><p className="activity-time">1 day ago</p>
              </div>
              <div className="activity-icon">📊</div>
            </div>
          </div>
        </div>
        <div className="content-card"><Calendar /></div>
        <div className="content-card">
          <h3 className="dashboard-card-title">Open Threats</h3>
          <p className="metric-value danger">{summary?.threat_count ?? 'N/A'}</p>
        </div>
        <div className="content-card">
          <h3 className="dashboard-card-title">Pending Reviews</h3>
          <p className="metric-value">{summary?.pending_vendor_assessments ?? 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}
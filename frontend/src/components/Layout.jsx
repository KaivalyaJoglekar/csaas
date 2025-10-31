import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const API_URL = import.meta.env.VITE_API_URL;

const Icon = ({ path, size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: size, height: size, flexShrink: 0 }}>
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

const Icons = { 
  Dashboard: <Icon path="M5.75 2.75a.75.75 0 00-1.5 0v14.5a.75.75 0 001.5 0V2.75zM10.25 2.75a.75.75 0 00-1.5 0v14.5a.75.75 0 001.5 0V2.75zM14 2.75a.75.75 0 011.5 0v14.5a.75.75 0 01-1.5 0V2.75z" />, 
  Shield: <Icon path="M9 1.06c.278-.26.64-.423 1.03-.497C11.536.495 12.87.822 14 1.765c1.554 1.282 2.22 3.422 2.22 5.235 0 1.83-1.04 4.53-2.33 6.136a13.387 13.387 0 01-3.235 3.39c-.588.46-1.462.46-2.05 0a13.387 13.387 0 01-3.236-3.39C3.26 12.53 2.22 9.83 2.22 8c0-1.813.666-3.953 2.22-5.235C5.553.822 6.887.495 8.384.563a.97.97 0 01.632.497z" />, 
  Admin: <Icon path="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A12.035 12.035 0 0110 16.5c3.059 0 5.842-1.153 7.931-3.095a1.23 1.23 0 00.41-1.412A9.982 9.982 0 0010 12a9.982 9.982 0 00-6.535 2.493z" />,
  Scan: <Icon path="M3.5 4.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zM8.5 4.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zM3.5 11.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zM11 13a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />,
  Report: <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />, 
  Search: <Icon path="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />,
  Bell: <Icon path="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />,
  Analyze: <Icon path="M15.582 8.024a5.5 5.5 0 11-9.164 4.952l-3.36 3.36a1 1 0 11-1.414-1.414l3.36-3.36a5.5 5.5 0 017.218-3.538zM5.5 8a3.5 3.5 0 107 0 3.5 3.5 0 00-7 0z" />
};

export default function Layout() {
  const { session, user, signOut } = useAuth();
  const [userRole, setUserRole] = useState('');
  const location = useLocation();

  useEffect(() => {
    const fetchRole = async () => {
      if (session) {
        try {
          const res = await axios.get(`${API_URL}/api/dashboard/summary`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          setUserRole(res.data.user_role);
        } catch (error) {
          console.error("Failed to fetch user role", error);
        }
      }
    };
    fetchRole();
  }, [session]);

  const navLinks = [
    { to: "/dashboard", icon: Icons.Dashboard, text: "Dashboard" },
    { to: "/scanner", icon: Icons.Scan, text: "Scanner" },
    { to: "/reports", icon: Icons.Report, text: "Reports" },
    { to: "/analyzer", icon: Icons.Analyze, text: "Analyzer" },
    { to: "/vendors", icon: Icons.Shield, text: "Vendors" },
    { to: "/admin/users", icon: Icons.Admin, text: "Admin", adminOnly: true },
  ];

  return (
    <div className="layout-container">
      <aside className="layout-sidebar">
        <div>
          <div className="layout-logo">CSaaS Corp.</div>
          <nav className="layout-nav">
            {navLinks.map(link => {
              if (link.adminOnly && userRole !== 'admin') return null;
              return (
                <Link key={link.to} to={link.to} className={`layout-nav-link ${location.pathname.startsWith(link.to) ? 'active' : ''}`}>
                  {link.icon}
                  <span>{link.text}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="layout-sidebar-footer">
          <div className="user-profile">
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`} alt="avatar" className="user-profile-avatar" />
            <div className="user-profile-details">
              <p className="user-profile-name">{user?.email}</p>
              <p className="user-profile-title">{userRole || 'User'}</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="layout-main">
        <header className="layout-header">
          <div />
          <div className="header-icons">
            <button className="header-icon-btn" aria-label="Search">{Icons.Search}</button>
            <button className="header-icon-btn" aria-label="Notifications">{Icons.Bell}</button>
            <button onClick={signOut} className="header-signout-btn">Sign Out</button>
          </div>
        </header>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


// frontend/src/components/Dashboard.jsx

import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../App';

const API_URL = import.meta.env.VITE_API_URL;

// --- ICON COMPONENTS (No change) ---
const Icon = ({ path }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: 20, height: 20 }}><path fillRule="evenodd" d={path} clipRule="evenodd" /></svg>;
const Icons = { Dashboard: <Icon path="M9 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 6a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM6 15a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zM11 4a1 1 0 100 2h1a1 1 0 100-2h-1zM13 9a1 1 0 100 2h1a1 1 0 100-2h-1zM15 13a1 1 0 100 2h1a1 1 0 100-2h-1z" />, Shield: <Icon path="M9 1.06c.278-.26.64-.423 1.03-.497C11.536.495 12.87.822 14 1.765c1.554 1.282 2.22 3.422 2.22 5.235 0 1.83-1.04 4.53-2.33 6.136a13.387 13.387 0 01-3.235 3.39c-.588.46-1.462.46-2.05 0a13.387 13.387 0 01-3.236-3.39C3.26 12.53 2.22 9.83 2.22 8c0-1.813.666-3.953 2.22-5.235C5.553.822 6.887.495 8.384.563 8.774.586 9.136.73 9.414 1.06zM10 8a2 2 0 100-4 2 2 0 000 4z" />, Alert: <Icon path="M8.257 3.099c.725-1.26 2.76-1.26 3.486 0l5.58 9.667c.726 1.26-.27 2.86-1.742 2.86H4.42c-1.472 0-2.468-1.6-1.743-2.86l5.58-9.667zM9 8a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM10 14a1 1 0 100-2 1 1 0 000 2z" />, Sun: <Icon path="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.225 5.636a1 1 0 011.414-1.414l.707.707a1 1 0 01-1.414 1.414l-.707-.707zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM4.225 14.364a1 1 0 011.414 1.414l.707-.707a1 1 0 01-1.414-1.414l-.707.707zM10 18a1 1 0 011-1h.01a1 1 0 110 2H11a1 1 0 01-1-1zM15.775 5.636a1 1 0 011.414 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707zM18 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM15.775 14.364a1 1 0 011.414-1.414l-.707-.707a1 1 0 011.414 1.414l.707.707z" />, Moon: <Icon path="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /> };

// --- NEW PROFILE POPOVER COMPONENT ---
const ProfilePopover = ({ user, onSignOut }) => (
    <div style={styles.popover.container}>
        <div style={styles.popover.section}>
            <p style={styles.popover.email}>{user?.email}</p>
        </div>
        <div style={styles.popover.section}>
            <button onClick={onSignOut} style={styles.popover.signOutButton}>Sign Out</button>
        </div>
    </div>
);

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
        <div style={styles.layout}>
            <aside style={styles.sidebar}>
                <div>
                    <div style={styles.logo}>C</div>
                    <nav style={styles.nav}>
                        <a href="#" style={{...styles.navLink, ...styles.navLink.active}}>{Icons.Dashboard}</a>
                        <a href="#" style={styles.navLink}>{Icons.Shield}</a>
                        <a href="#" style={styles.navLink}>{Icons.Alert}</a>
                    </nav>
                </div>
                <div style={{ position: 'relative' }} ref={profileRef}>
                    <button onClick={toggleTheme} style={styles.navLink}>{themeMode === 'light' ? Icons.Moon : Icons.Sun}</button>
                    <button onClick={() => setProfileOpen(p => !p)} style={styles.avatarButton}>
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`} alt="avatar" style={{width: '100%', height: '100%'}} />
                    </button>
                    {isProfileOpen && <ProfilePopover user={user} onSignOut={signOut} />}
                </div>
            </aside>
            <main style={styles.mainContent}>
                {/* Main content from previous design (still fits well) */}
                 <h1 style={styles.headerTitle}>Dashboard</h1>
                <div style={styles.mainGrid}>
                     <div style={{ ...styles.card, gridColumn: 'span 2' }}>
                        <h3 style={styles.cardTitle}>Posture Overview</h3>
                        <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>[Main Graph Placeholder]</div>
                    </div>
                     <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Open Threats</h3>
                        <p style={{ ...styles.metricValue, color: '#F87171' }}>{data?.summary?.threat_count ?? 'N/A'}</p>
                    </div>
                     <div style={styles.card}>
                         <h3 style={styles.cardTitle}>Pending Reviews</h3>
                        <p style={styles.metricValue}>{data?.summary?.pending_vendor_assessments ?? 'N/A'}</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

// --- STYLES OBJECT ---
const styles = {
    layout: { display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' },
    sidebar: { width: 80, backdropFilter: 'blur(20px)', backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
    logo: { width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(45deg, #4F46E5, #818CF8)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 },
    nav: { display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40 },
    navLink: { color: 'var(--text-secondary)', padding: 10, borderRadius: 10, display: 'flex', justifyContent: 'center', cursor: 'pointer', background: 'none', border: 'none', transition: 'all var(--transition-speed)', '&:hover': { color: 'var(--primary-accent)', backgroundColor: 'var(--primary-accent-light)' }, active: { backgroundColor: 'var(--primary-accent-light)', color: 'var(--primary-accent)' }},
    avatarButton: { width: 40, height: 40, borderRadius: '50%', marginTop: 16, cursor: 'pointer', border: '2px solid var(--primary-accent-light)', padding: 0, overflow: 'hidden' },
    mainContent: { flex: 1, padding: 40, overflowY: 'auto' },
    headerTitle: { fontSize: '2rem', fontWeight: 700, marginBottom: 24 },
    mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 },
    card: { backdropFilter: 'blur(20px)', backgroundColor: 'var(--bg-secondary)', borderRadius: 16, padding: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', transition: 'transform var(--transition-speed)', '&:hover': { transform: 'translateY(-4px)' } },
    cardTitle: { margin: '0 0 16px 0', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' },
    metricValue: { margin: 0, fontSize: '2.5rem', fontWeight: 700 },
    popover: {
        container: { position: 'absolute', bottom: 60, left: 70, width: 220, backgroundColor: 'var(--bg-tertiary)', borderRadius: 12, boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-color)', zIndex: 20, overflow: 'hidden' },
        section: { padding: '8px', borderBottom: '1px solid var(--border-color)' },
        email: { margin: 0, padding: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', wordBreak: 'break-all' },
        signOutButton: { background: 'none', border: 'none', color: '#F87171', padding: '12px', width: '100%', textAlign: 'left', fontWeight: 600, borderRadius: 6, cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(248, 113, 113, 0.1)' } },
    }
};
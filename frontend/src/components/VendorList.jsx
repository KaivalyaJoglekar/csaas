import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export default function VendorList() {
  const { session } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/vendors`, { headers: { Authorization: `Bearer ${session?.access_token}` } });
        setVendors(res.data || []);
      } catch (e) { console.error(e); alert('Failed to load vendors'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [session]);

  if (loading) return <div className="loader-container"><div className="loader-spinner"></div></div>;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Vendors</h1>
        <Link to="/vendors/new" style={{ padding: '8px 12px', background: 'var(--primary-accent)', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>New Vendor</Link>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {vendors.map(v => (
          <Link key={v.id} to={`/vendors/${v.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{v.name}</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v.description}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v.contact_email}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

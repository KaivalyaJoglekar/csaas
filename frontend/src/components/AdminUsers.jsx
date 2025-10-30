import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminUsers() {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${session?.access_token}` } });
        setUsers(res.data || []);
      } catch (e) {
        console.error('Failed to fetch users', e);
        alert('Failed to fetch users. Check console.');
      } finally { setLoading(false); }
    };
    fetchUsers();
  }, [session]);

  const changeRole = async (userId, role) => {
    try {
      await axios.post(`${API_URL}/api/admin/set-user-role`, { user_id: userId, role }, { headers: { Authorization: `Bearer ${session?.access_token}` } });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      alert('Role updated');
    } catch (e) {
      console.error('Error updating role', e);
      alert('Failed to update role.');
    }
  };

  if (loading) return <div className="loader-container"><div className="loader-spinner"></div></div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ marginBottom: 16 }}>User Management</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        {users.map(u => (
          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div>
              <strong>{u.email}</strong>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.id}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select defaultValue={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                <option value="sme">SME</option>
                <option value="auditor">Auditor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export default function VendorDetail() {
  const { id } = useParams();
  const { session } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/vendors/${id}`, { headers: { Authorization: `Bearer ${session?.access_token}` } });
        setVendor(res.data);
      } catch (e) { console.error(e); alert('Failed to load vendor'); }
      finally { setLoading(false); }
    };
    if (id !== 'new') fetch();
    else { setVendor({ name: '', description: '', contact_email: '' }); setLoading(false); }
  }, [id, session]);

  const handleSave = async () => {
    try {
      if (id === 'new') {
        await axios.post(`${API_URL}/api/vendors`, vendor, { headers: { Authorization: `Bearer ${session?.access_token}` } });
        alert('Vendor created');
        window.location.href = '/vendors';
      } else {
        await axios.put(`${API_URL}/api/vendors/${id}`, vendor, { headers: { Authorization: `Bearer ${session?.access_token}` } });
        alert('Updated');
      }
    } catch (e) { console.error(e); alert('Save failed'); }
  };

  const uploadEvidence = async () => {
    if (!file) return alert('Choose a file first');
    const form = new FormData();
    form.append('file', file);
    try {
      await axios.post(`${API_URL}/api/vendors/${id}/evidence`, form, { headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'multipart/form-data' } });
      alert('Uploaded');
    } catch (e) { console.error(e); alert('Upload failed'); }
  };

  if (loading) return <div className="loader-container"><div className="loader-spinner"></div></div>;

  return (
    <div style={{ padding: 32 }}>
      <h1>{id === 'new' ? 'New Vendor' : `Vendor: ${vendor?.name}`}</h1>
      <div style={{ maxWidth: 720, display: 'grid', gap: 12 }}>
        <input placeholder="Name" value={vendor?.name || ''} onChange={(e) => setVendor({ ...vendor, name: e.target.value })} />
        <input placeholder="Contact Email" value={vendor?.contact_email || ''} onChange={(e) => setVendor({ ...vendor, contact_email: e.target.value })} />
        <textarea placeholder="Description" value={vendor?.description || ''} onChange={(e) => setVendor({ ...vendor, description: e.target.value })} />

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} style={{ padding: '10px 14px', background: 'var(--primary-accent)', color: '#fff', borderRadius: 8 }}>Save</button>
          {id !== 'new' && (
            <>
              <input type="file" onChange={(e) => setFile(e.target.files[0])} />
              <button onClick={uploadEvidence} style={{ padding: '10px 14px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderRadius: 8 }}>Upload Evidence</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

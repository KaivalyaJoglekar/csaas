// frontend/src/components/Scanner.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './Scanner.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function Scanner() {
  const { session } = useAuth();
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Initialize navigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!target) {
      setError('Please enter a target URL or IP address');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      // Simulate a longer scan time for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await axios.post(
        `${API_URL}/api/scans/initiate`,
        { target },
        { headers: { 'Authorization': `Bearer ${session.access_token}` } }
      );
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initiate scan');
      console.error('Scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanner-modern-bg">
      {/* Animated background elements */}
      <div className="scanner-modern-bg-elements">
        <div className="scanner-modern-bg-element bg-element-1"></div>
        <div className="scanner-modern-bg-element bg-element-2"></div>
        <div className="scanner-modern-bg-element bg-element-3"></div>
      </div>
      
      <div className="scanner-modern-container">
        <div className="scanner-modern-card">
          <div className="scanner-modern-card-inner">
            <div className="scanner-modern-header">
              <h1 className="scanner-modern-title">Security Scanner</h1>
              <p className="scanner-modern-subtitle">
                Identify vulnerabilities in your systems and applications
              </p>
            </div>

            <form onSubmit={handleSubmit} className="scanner-modern-form">
              <div className="input-group">
                <label className="input-label">Target System</label>
                <input
                  className="modern-input"
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g., https://example.com"
                  aria-label="Target system to scan"
                />
                <p className="input-hint">For demo, you can use any valid URL like https://example.com</p>
              </div>

              {error && (
                <div className="scanner-error-message">
                  {error}
                </div>
              )}

              <button className="modern-button" type="submit" disabled={loading}>
                {loading ? (
                  <div className="button-loader">
                    <div className="spinner"></div>
                    <span>Scanning...</span>
                  </div>
                ) : (
                  'Start Security Scan'
                )}
              </button>
            </form>

            {result && (
              <div className="scanner-result-card">
                <h3 className="scanner-result-title">Scan Results</h3>
                <div className="scanner-result-content">
                  <div className="result-item">
                    <span className="result-label">Status:</span>
                    <span className="result-value success">Completed</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Target:</span>
                    <span className="result-value">{target}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Risk Level:</span>
                    <span className="result-value danger">High</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Vulnerability:</span>
                    <span className="result-value">Simulated SQL Injection</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Incident ID Created:</span>
                    <span className="result-value">{result.incident_id.slice(0, 8)}...</span>
                  </div>
                </div>
                <div className="scanner-actions">
                  <button 
                    className="modern-button secondary"
                    onClick={() => navigate('/reports')}
                  >
                    Generate Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
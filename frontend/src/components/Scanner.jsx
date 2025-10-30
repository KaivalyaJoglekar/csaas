// frontend/src/components/Scanner.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Scanner.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function Scanner() {
  const { session } = useAuth();
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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
                  placeholder="Enter URL or IP address (e.g., https://example.com or 192.168.1.1)"
                  aria-label="Target system to scan"
                />
                <p className="input-hint">Example: https://yourwebsite.com or 192.168.1.100</p>
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
                    <span className="result-value">{result.target || target}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Scan ID:</span>
                    <span className="result-value">{result.scan_id}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Threat ID:</span>
                    <span className="result-value">{result.threat_id}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Incident ID:</span>
                    <span className="result-value">{result.incident_id}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Risk Level:</span>
                    <span className="result-value danger">High</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Vulnerability:</span>
                    <span className="result-value">SQL Injection</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Description:</span>
                    <span className="result-value">
                      High risk SQLi vulnerability discovered on {target}
                    </span>
                  </div>
                </div>
                <div className="scanner-actions">
                  <button 
                    className="modern-button secondary"
                    onClick={() => window.location.href = '/reports'}
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
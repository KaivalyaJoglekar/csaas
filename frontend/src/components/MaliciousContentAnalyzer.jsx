import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './MaliciousContentAnalyzer.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function MaliciousContentAnalyzer() {
  const { session } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setResult(null);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to analyze.');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/reports/analyze-content`, formData, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const getRiskLevelClass = (level) => {
    const l = level?.toLowerCase();
    if (l === 'critical' || l === 'high') return 'risk-high';
    if (l === 'medium') return 'risk-medium';
    if (l === 'low') return 'risk-low';
    return 'risk-safe';
  };

  return (
    <div>
      <h1 className="page-header">Malicious Content Analyzer</h1>
      <div className="content-card" style={{ maxWidth: '800px' }}>
        <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>
          Upload a .txt or .pdf document to scan it for malicious content like phishing links, scams, and social engineering tactics using AI.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="file-upload-area">
            <input type="file" id="file-upload" accept=".txt,.pdf" onChange={handleFileChange} />
            <label htmlFor="file-upload" className="file-upload-label">
              <span>{fileName || 'Click to select a .txt or .pdf file'}</span>
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading || !file}>
            {loading ? <div className="loader-spinner" style={{width: '20px', height: '20px', borderWidth: '2px'}}></div> : null}
            <span>{loading ? 'Analyzing...' : 'Analyze Document'}</span>
          </button>
        </form>

        {result && (
          <div className="analysis-results">
            <h3 className="results-title">Analysis Report</h3>
            <div className={`result-card ${getRiskLevelClass(result.risk_level)}`}>
              <div className="risk-level-display">
                Risk Level: <span>{result.risk_level}</span>
              </div>
              <p className="summary-text">{result.summary}</p>
            </div>
            
            {result.findings && result.findings.length > 0 && (
              <div className="findings-section">
                <h4>Specific Findings:</h4>
                <ul>
                  {result.findings.map((finding, index) => (
                    <li key={index}>
                      <strong>{finding.type}:</strong> {finding.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
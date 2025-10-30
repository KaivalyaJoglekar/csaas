// frontend/src/components/Reporter.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Reporter.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function Reporter() {
  const { session, user } = useAuth();
  const [reportType, setReportType] = useState('Risk Assessment');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/api/reports/generate`,
        { report_type: reportType },
        { headers: { 'Authorization': `Bearer ${session.access_token}` } }
      );
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate report');
      console.error('Report error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sample report data for demo
  const sampleReportData = {
    executiveSummary: {
      score: "C+",
      status: "Needs Improvement",
      criticalRisks: 2,
      mediumRisks: 3,
      urgentIssue: "Exposed database port"
    },
    keyFindings: [
      {
        id: 1,
        riskLevel: "High",
        technical: "Open Database Port (Port 3306) accessible from the internet",
        business: "A critical 'door' to your customer database was left open to the entire internet. This is like leaving the key to your cash register taped to the front window.",
        action: "Have your IT provider or web developer immediately place this behind a firewall so only the website can access it."
      },
      {
        id: 2,
        riskLevel: "Medium",
        technical: "Outdated SSL/TLS Configuration",
        business: "Your website is using encryption methods that are no longer considered secure, making it easier for attackers to intercept sensitive information.",
        action: "Update your SSL/TLS certificates and server configuration to use modern encryption standards."
      },
      {
        id: 3,
        riskLevel: "Medium",
        technical: "Missing Security Headers",
        business: "Your website is missing important security protections that help prevent common web attacks like clickjacking and cross-site scripting.",
        action: "Configure your web server to include security headers such as X-Frame-Options, Content-Security-Policy, and X-Content-Type-Options."
      }
    ],
    nextSteps: [
      "Contact us to help you fix these issues",
      "Schedule a follow-up security assessment in 30 days",
      "Implement monthly vulnerability scanning",
      "Provide cybersecurity training for your team"
    ]
  };

  return (
    <div className="reporter-modern-bg">
      {/* Animated background elements */}
      <div className="reporter-modern-bg-elements">
        <div className="reporter-modern-bg-element bg-element-1"></div>
        <div className="reporter-modern-bg-element bg-element-2"></div>
        <div className="reporter-modern-bg-element bg-element-3"></div>
      </div>
      
      <div className="reporter-modern-container">
        <div className="reporter-modern-card">
          <div className="reporter-modern-card-inner">
            <div className="reporter-modern-header">
              <h1 className="reporter-modern-title">Security Reporting</h1>
              <p className="reporter-modern-subtitle">
                Generate actionable cybersecurity reports for your business
              </p>
            </div>

            <form onSubmit={handleSubmit} className="reporter-modern-form">
              <div className="input-group">
                <label className="input-label">Report Type</label>
                <select 
                  className="modern-input"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="Risk Assessment">Risk Assessment</option>
                  <option value="Compliance Report">Compliance Report</option>
                  <option value="Vulnerability Scan">Vulnerability Scan</option>
                  <option value="Incident Report">Incident Report</option>
                </select>
              </div>

              {error && (
                <div className="reporter-error-message">
                  {error}
                </div>
              )}

              <button className="modern-button" type="submit" disabled={loading}>
                {loading ? (
                  <div className="button-loader">
                    <div className="spinner"></div>
                    <span>Generating Report...</span>
                  </div>
                ) : (
                  'Generate Security Report'
                )}
              </button>
            </form>

            {result && (
              <div className="report-success-message">
                <h3>Report Generated Successfully!</h3>
                <p>Your {result.data?.report_type || reportType} has been created.</p>
                <button 
                  className="modern-button secondary"
                  onClick={() => window.open(`/reports/${result.data?.id || 'sample'}`, '_blank')}
                >
                  View Report
                </button>
              </div>
            )}

            {/* Sample Report Preview */}
            <div className="report-preview-section">
              <h2 className="report-preview-title">Sample Security Report Preview</h2>
              <div className="report-preview-card">
                <div className="report-header">
                  <h1>Cybersecurity Health Report</h1>
                  <div className="report-meta">
                    <p>Prepared for: {user?.email || 'Sample Business'}</p>
                    <p>Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="report-section">
                  <h2>Executive Summary</h2>
                  <div className="executive-summary">
                    <div className="score-card">
                      <span className="score-value">{sampleReportData.executiveSummary.score}</span>
                      <span className="score-status">{sampleReportData.executiveSummary.status}</span>
                    </div>
                    <p>
                      We scanned your systems and found <strong>{sampleReportData.executiveSummary.criticalRisks} Critical</strong> and <strong>{sampleReportData.executiveSummary.mediumRisks} Medium</strong> risks. 
                      Your most urgent issue is <strong>{sampleReportData.executiveSummary.urgentIssue}</strong>.
                    </p>
                  </div>
                </div>

                <div className="report-section">
                  <h2>Key Findings</h2>
                  <div className="findings-list">
                    {sampleReportData.keyFindings.map((finding) => (
                      <div key={finding.id} className="finding-item">
                        <div className="finding-header">
                          <span className={`risk-badge ${finding.riskLevel.toLowerCase()}`}>
                            {finding.riskLevel} Risk
                          </span>
                        </div>
                        <div className="finding-content">
                          <h3>What We Found (Technical)</h3>
                          <p className="technical">{finding.technical}</p>
                          
                          <h3>What This Means (Business Language)</h3>
                          <p className="business">{finding.business}</p>
                          
                          <h3>What You Should Do (Action)</h3>
                          <p className="action">{finding.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="report-section">
                  <h2>Next Steps</h2>
                  <ul className="next-steps-list">
                    {sampleReportData.nextSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="report-footer">
                  <p>Generated by CSaaS Platform - Making cybersecurity simple for small businesses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
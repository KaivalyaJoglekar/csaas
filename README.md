# CSaaS Platform (Cybersecurity as a Service)

A comprehensive cybersecurity platform designed for small and medium enterprises (SMEs) to easily identify, understand, and address security vulnerabilities without requiring deep technical expertise.

## Overview

The CSaaS Platform provides SMEs with professional-grade cybersecurity capabilities through an intuitive interface that translates complex technical findings into actionable business insights.

## Features

### 1. Security Scanning
- Identify vulnerabilities in systems and applications
- Simulate professional security scanning tools
- Generate actionable security findings

### 2. Security Reporting
- Translate technical findings into business language
- Provide clear remediation steps
- Generate professional security reports

### 3. Dashboard & Analytics
- Real-time security posture overview
- Track open threats and pending reviews
- Monitor recent security activities

### 4. User Management
- Role-based access control (Admin, SME, Auditor)
- Secure authentication with Supabase
- User profile management

### 5. Vendor Management
- Vendor listing and detail management
- Vendor assessment workflows
- Evidence upload and tracking

## Technology Stack

### Frontend
- React 18
- Vite.js
- React Router
- Axios for API calls
- Supabase JavaScript Client

### Backend
- FastAPI (Python)
- Supabase (Database & Authentication)
- PostgreSQL

### Infrastructure
- Supabase (Backend as a Service)
- Cloud deployment ready

## Quick Start

1. **Install Dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend (if running locally)
   cd backend
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Environment Setup**
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Configure Supabase credentials

3. **Run the Application**
   ```bash
   # Frontend
   cd frontend
   npm run dev
   
   # Backend (if running locally)
   cd backend
   source .venv/bin/activate
   python main.py
   ```

## Demo Guide

See [DEMO_GUIDE.md](DEMO_GUIDE.md) for detailed instructions on demonstrating the Scanning and Reporting features.

## Key Benefits for SMEs

1. **No Technical Expertise Required**
   - Complex security findings are translated into simple business language
   - Clear action steps that can be given to IT providers

2. **Professional Security Assessment**
   - Industry-standard scanning simulation
   - Professional report generation

3. **Actionable Insights**
   - Prioritized risks based on business impact
   - Clear remediation guidance

## Architecture

The platform follows a modern web application architecture with a React frontend and FastAPI backend, using Supabase for database and authentication services.

## Development

### Frontend Components
- `AuthForm.jsx` - Authentication (Login/Signup)
- `Dashboard.jsx` - Main dashboard with analytics
- `Scanner.jsx` - Security scanning interface
- `Reporter.jsx` - Security reporting interface
- `VendorList.jsx` / `VendorDetail.jsx` - Vendor management
- `AdminUsers.jsx` - User administration

### Backend Endpoints
- `/api/scans/initiate` - Initiate security scan
- `/api/reports/generate` - Generate security report
- `/api/dashboard/summary` - Dashboard analytics
- Various vendor and user management endpoints

## Future Enhancements

- Integration with actual security scanning tools (Nmap, OWASP ZAP)
- Advanced reporting with customizable templates
- Automated scheduled scanning
- Compliance framework alignment
- Training and awareness modules
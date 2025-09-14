# SaaS Drive — Finovo Business Management Platform

A complete business management platform built with Netlify + Vite (React) SPA, Netlify Functions as API, and Supabase for data storage. Features include invoice management, receipt processing with OCR, expense tracking, and more.

## Features

### ✅ Completed
- **Invoice Management** - Create, view, manage invoices with PDF generation
- **Receipt Management** - Upload receipts with OCR, approval workflow, expense tracking
- **Client Management** - Comprehensive client database
- **Dashboard** - Real-time analytics and overview
- **Mobile-Responsive** - Optimized for all devices

### 🚧 In Development
- Advanced reporting and analytics
- Inventory management
- CRM features

## Development

### Quick Start
```bash
npm install
npm run dev  # Starts both frontend and API functions
```

### Frontend Only (Limited functionality)
```bash
npm run dev:frontend  # Only React app, API functions not available
```

The receipt system and some features require the full development environment (`npm run dev`) to access Netlify functions.

## Environment Setup

Required environment variables (see `.env` file):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- Google integration variables for Drive/Sheets features

## Deploy
- Push to GitHub
- Connect to Netlify
- Set env vars (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, TENANTS_SHEET_ID)
- Deploy

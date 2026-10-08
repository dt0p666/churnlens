import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CurrencyProvider } from './context/CurrencyContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Overview from './pages/Overview';
import Customers from './pages/Customers';
import Predict from './pages/Predict';
import WhatIf from './pages/WhatIf';
import Batch from './pages/Batch';
import Analytics from './pages/Analytics';
import ModelIntel from './pages/ModelIntel';
import ApiDocs from './pages/ApiDocs';
import Settings from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-lg mx-auto my-12 bg-navy-900 border border-rose-500/40 rounded-xl text-center space-y-4">
          <h2 className="text-lg font-bold text-rose-400">Rendering Exception</h2>
          <p className="text-xs text-slate-300 font-mono">{this.state.error?.message || 'Unexpected runtime error'}</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-4 py-2 rounded-lg bg-cyanAccent text-slate-100 font-bold text-xs"
          >
            Reload ChurnLens
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <CurrencyProvider>
      <BrowserRouter>
        <div className="flex h-screen bg-navy-950 text-slate-100 overflow-hidden relative selection:bg-cyanAccent/40 selection:text-slate-100">
          {/* Persistent Enterprise Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto flex flex-col min-h-full">
                <div className="flex-1">
                  <ErrorBoundary>
                    <Routes>
                      <Route path="/" element={<Overview />} />
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/predict" element={<Predict />} />
                      <Route path="/what-if" element={<WhatIf />} />
                      <Route path="/batch" element={<Batch />} />
                      <Route path="/model-info" element={<ModelIntel />} />
                      <Route path="/model-intel" element={<ModelIntel />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/api-docs" element={<ApiDocs />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/terms" element={<TermsOfService />} />
                    </Routes>
                  </ErrorBoundary>
                </div>
                <Footer />
              </div>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </CurrencyProvider>
  );
}

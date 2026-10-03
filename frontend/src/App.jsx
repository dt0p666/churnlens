import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './pages/Overview';
import Customers from './pages/Customers';
import Predict from './pages/Predict';
import WhatIf from './pages/WhatIf';
import Batch from './pages/Batch';
import Analytics from './pages/Analytics';
import ModelIntel from './pages/ModelIntel';
import ApiDocs from './pages/ApiDocs';
import Settings from './pages/Settings';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-navy-950 text-slate-100 overflow-hidden relative selection:bg-cyanAccent selection:text-navy-950">
        {/* Soft Ambient Radial Glow Behind Content */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyanAccent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-violetSecondary/5 rounded-full blur-3xl pointer-events-none" />

        {/* Persistent Enterprise Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
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
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

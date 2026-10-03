import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './pages/Overview';
import Predict from './pages/Predict';
import WhatIf from './pages/WhatIf';
import Batch from './pages/Batch';
import Analytics from './pages/Analytics';
import ModelIntel from './pages/ModelIntel';
import ApiDocs from './pages/ApiDocs';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
        {/* Persistent Enterprise Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header title="ChurnLens Intelligence Platform" subtitle="Production Machine Learning & Counterfactual Simulation" />

          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Overview />} />
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

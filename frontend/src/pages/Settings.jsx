import React, { useState } from 'react';
import { Settings as SettingsIcon, Sliders, Database, Server, Shield, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const [threshold, setThreshold] = useState(0.35);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Platform Settings & Runtime Configuration</h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure inference decision boundaries, database persistence parameters, and API runtime environment.
        </p>
      </div>

      {/* Threshold Tuner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Default Decision Threshold</h3>
          </div>
          <span className="text-sm font-mono font-bold text-emerald-400">{threshold}</span>
        </div>

        <p className="text-xs text-slate-400">
          The decision boundary determining when a customer is flagged for retention intervention. Lowering the threshold increases recall (catches more churners) at the expense of false positives.
        </p>

        <input
          type="range"
          min="0.10"
          max="0.90"
          step="0.05"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />

        <div className="flex justify-between text-[11px] text-slate-500">
          <span>0.10 (Aggressive Retention)</span>
          <span>0.35 (F1-Optimal)</span>
          <span>0.50 (Standard 50/50)</span>
          <span>0.90 (Conservative)</span>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
            {saved ? 'Saved Threshold' : 'Apply Threshold'}
          </button>
          {saved && <span className="text-xs text-emerald-400">Updated default operating threshold.</span>}
        </div>
      </div>

      {/* Infrastructure Telemetry */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Infrastructure & Runtime Telemetry</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block mb-0.5">Backend API URL</span>
            <span className="font-mono text-slate-200">{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block mb-0.5">Database Driver</span>
            <span className="font-mono text-slate-200">SQLAlchemy 2.0 (SQLite / PostgreSQL)</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block mb-0.5">Model Artifact Location</span>
            <span className="font-mono text-slate-200">models/production/pipeline.joblib</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block mb-0.5">Explainability Engine</span>
            <span className="font-mono text-slate-200">SHAP 0.52.0 (TreeExplainer)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

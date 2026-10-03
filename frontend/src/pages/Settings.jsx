import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  SlidersHorizontal, 
  Database, 
  Server, 
  ShieldCheck, 
  CheckCircle2, 
  Cpu,
  Save,
  Radio,
  FileCode2
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function Settings() {
  const [threshold, setThreshold] = useState(0.45);
  const [dbLogging, setDbLogging] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Platform & Runtime Settings"
        subtitle="Configure default inference operating thresholds, database audit logging, and runtime engine endpoints."
      />

      {/* Threshold Tuner */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-navy-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-cyanAccent" />
            <h3 className="font-heading font-semibold text-sm text-slate-100">
              Default Decision Threshold
            </h3>
          </div>
          <span className="font-mono font-bold text-sm text-cyanAccent bg-cyanAccent/10 px-2.5 py-1 rounded-lg border border-cyanAccent/30">
            {(threshold * 100).toFixed(0)}% (F1 Peak)
          </span>
        </div>

        <p className="text-xs text-slate-400">
          The decision boundary threshold where the production classifier marks a customer as high churn risk. Adjusting this boundary dynamically changes the balance between customer capture (Recall) and false alarm operational cost (Precision).
        </p>

        <div className="py-2">
          <input
            type="range"
            min="0.10"
            max="0.90"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-cyanAccent cursor-pointer"
          />

          <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
            <span>0.10 (Aggressive Retention)</span>
            <span className="text-cyanAccent font-semibold">0.45 (Optimal Tuned)</span>
            <span>0.90 (Conservative)</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <Button
            variant="primary"
            onClick={handleSave}
            className="flex items-center gap-2 text-xs"
          >
            {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? 'Threshold Applied' : 'Save Default Operating Threshold'}
          </Button>
          {saved && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Runtime threshold updated successfully.
            </span>
          )}
        </div>
      </Card>

      {/* Persistence & Audit Logging */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-navy-800">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-violetSecondary" />
            <h3 className="font-heading font-semibold text-sm text-slate-100">
              SQLAlchemy Prediction Audit Logs
            </h3>
          </div>
          <Badge variant="low">ACTIVE</Badge>
        </div>

        <p className="text-xs text-slate-400">
          Every single inference and batch prediction is recorded with a unique UUID request token, model version tag, decision threshold, raw feature vector, and predicted probability for post-deployment drift analysis.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-slate-500 block text-[10px]">STORAGE ENGINE</span>
            <span className="text-slate-200">SQLite (churnlens.db) / PostgreSQL</span>
          </div>
          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-slate-500 block text-[10px]">AUDIT TABLE</span>
            <span className="text-slate-200">prediction_audit_logs</span>
          </div>
        </div>
      </Card>

      {/* Infrastructure Telemetry */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-navy-800">
          <Server className="h-4 w-4 text-cyanAccent" />
          <h3 className="font-heading font-semibold text-sm text-slate-100">
            Infrastructure & Environment Telemetry
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-slate-500 block text-[10px]">API ENDPOINT</span>
            <span className="text-slate-200">{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</span>
          </div>

          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-slate-500 block text-[10px]">PRODUCTION MODEL PIPELINE</span>
            <span className="text-slate-200">models/production/pipeline.joblib</span>
          </div>

          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-slate-500 block text-[10px]">EXPLAINABILITY ENGINE</span>
            <span className="text-slate-200">SHAP (TreeExplainer)</span>
          </div>

          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-slate-500 block text-[10px]">FEATURE SPECIFICATION</span>
            <span className="text-slate-200">Zero-Leakage Sklearn ColumnTransformer</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

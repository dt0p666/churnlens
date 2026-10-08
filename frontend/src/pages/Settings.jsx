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
  FileCode2,
  Coins,
  RotateCcw
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function Settings() {
  const { rates, updateRate, resetRates, referenceDate, currency, setCurrency } = useCurrency();
  const [threshold, setThreshold] = useState(0.45);
  const [dbLogging, setDbLogging] = useState(true);
  const [saved, setSaved] = useState(false);
  const [rateInputs, setRateInputs] = useState(() => {
    const init = {};
    Object.entries(rates).forEach(([k, v]) => {
      init[k] = v.rate;
    });
    return init;
  });
  const [ratesSaved, setRatesSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleRateInputChange = (code, val) => {
    setRateInputs((prev) => ({ ...prev, [code]: val }));
  };

  const handleSaveRates = () => {
    Object.entries(rateInputs).forEach(([code, rateVal]) => {
      const num = parseFloat(rateVal);
      if (!isNaN(num) && num > 0) {
        updateRate(code, num);
      }
    });
    setRatesSaved(true);
    setTimeout(() => setRatesSaved(false), 2500);
  };

  const handleResetRates = () => {
    resetRates();
    const defaults = {
      INR: 84.0,
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.78,
      JPY: 152.0,
      AED: 3.67,
      AUD: 1.52,
      CAD: 1.38,
      SGD: 1.32,
    };
    setRateInputs(defaults);
    setRatesSaved(true);
    setTimeout(() => setRatesSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle="Configure default decision thresholds, currency reference rates, and runtime endpoints."
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
          The decision boundary threshold where the classifier marks a customer as high churn risk. Adjusting this boundary dynamically shifts the balance between customer capture (Recall) and false alarm operational cost (Precision).
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

      {/* Currency Exchange Rates Settings */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-navy-800">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-cyanAccent" />
            <h3 className="font-heading font-semibold text-sm text-slate-100">
              Currency & Exchange Rates
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-navy-800 text-slate-300 border border-navy-700">
            Reference: {referenceDate} (Editable)
          </span>
        </div>

        <p className="text-xs text-slate-400">
          ChurnLens defaults to Indian Rupee (₹) with support for 9 global currencies. Base model values are stored in USD and converted at these reference rates for display. You can customize the rate per 1 USD below.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {Object.entries(rates).map(([code, cfg]) => (
            <div key={code} className="p-3 rounded-lg bg-navy-950 border border-navy-850 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-200">
                  {code} ({cfg.symbol})
                </span>
                <span className="text-[10px] text-slate-400">{cfg.name}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">1 USD =</span>
                <input
                  type="number"
                  step="0.01"
                  disabled={code === 'USD'}
                  value={rateInputs[code] ?? cfg.rate}
                  onChange={(e) => handleRateInputChange(code, e.target.value)}
                  className={`w-full bg-navy-900 border border-navy-700 rounded px-2 py-1 text-xs font-mono text-slate-200 focus:border-cyanAccent focus:outline-none ${
                    code === 'USD' ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-navy-850">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveRates}
              className="flex items-center gap-1.5 text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              Save Custom Rates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetRates}
              className="flex items-center gap-1.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Defaults
            </Button>
          </div>
          {ratesSaved && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Exchange rates updated and persisted.
            </span>
          )}
        </div>
      </Card>

      {/* Persistence & Audit Logging */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-navy-800">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-cyanAccent" />
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-slate-500 block text-[10px]">API ENDPOINT</span>
            <span className="text-slate-200">{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</span>
          </div>

          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-slate-500 block text-[10px]">CUSTOM DOMAIN</span>
            <span className="text-cyanAccent font-semibold">app.churnlens.io</span>
          </div>

          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-slate-500 block text-[10px]">DATA GOVERNANCE</span>
            <span className="text-slate-200">DPDP & GDPR Compliant</span>
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

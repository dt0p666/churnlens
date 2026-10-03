import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink, Code } from 'lucide-react';

export default function ApiDocs() {
  const [copied, setCopied] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const sampleCurl = `curl -X POST "${API_URL}/predict?include_explanation=true" \\
  -H "Content-Type: application/json" \\
  -d '{
    "Gender": "Female",
    "Senior Citizen": "No",
    "Partner": "No",
    "Dependents": "No",
    "Tenure Months": 2,
    "Phone Service": "Yes",
    "Multiple Lines": "No",
    "Internet Service": "Fiber optic",
    "Online Security": "No",
    "Online Backup": "No",
    "Device Protection": "No",
    "Tech Support": "No",
    "Streaming TV": "Yes",
    "Streaming Movies": "Yes",
    "Contract": "Month-to-month",
    "Paperless Billing": "Yes",
    "Payment Method": "Electronic check",
    "Monthly Charges": 95.80,
    "Total Charges": 191.60
  }'`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleCurl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ENDPOINTS = [
    { method: 'GET', path: '/health', desc: 'Liveness probe and model runtime readiness check.' },
    { method: 'GET', path: '/model/info', desc: 'Metadata, cross-validation metrics, ROC/PR curves, and top feature importances.' },
    { method: 'POST', path: '/predict', desc: 'Predict churn probability, assign risk tier, and compute local SHAP feature attributions.' },
    { method: 'POST', path: '/predict/batch', desc: 'Upload CSV for vectorized row-by-row scoring, validation summary, and streaming export.' },
    { method: 'POST', path: '/explain', desc: 'Dedicated TreeSHAP explainer endpoint returning top risk drivers.' },
    { method: 'GET', path: '/analytics/summary', desc: 'Dataset KPIs (revenue lost, retained count, churn rate).' },
    { method: 'GET', path: '/analytics/churn-distribution', desc: 'Empirical hazard distributions across contracts, services, and tenure.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">API Reference & Developer Playground</h2>
          <p className="text-xs text-slate-400 mt-1">
            Production-grade RESTful interface built with FastAPI, Pydantic v2 schemas, and CORS security.
          </p>
        </div>

        <a
          href={`${API_URL}/docs`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Open Swagger / OpenAPI UI
        </a>
      </div>

      {/* Curl Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span>cURL Inference Snippet</span>
          </div>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy cURL'}
          </button>
        </div>

        <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
          {sampleCurl}
        </pre>
      </div>

      {/* Endpoints Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Available REST Endpoints</h3>
        </div>

        <div className="divide-y divide-slate-800/60 text-xs">
          {ENDPOINTS.map((ep, idx) => (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850/50">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    ep.method === 'GET'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="font-mono text-white text-xs">{ep.path}</span>
              </div>
              <p className="text-xs text-slate-400 sm:max-w-md">{ep.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

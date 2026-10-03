import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink, Code2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

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
    { method: 'POST', path: '/whatif', desc: 'Evaluate counterfactual covariate modifications on the model decision boundary.' },
    { method: 'GET', path: '/analytics/summary', desc: 'Dataset KPIs (revenue lost, retained count, churn rate).' },
    { method: 'GET', path: '/analytics/churn-distribution', desc: 'Empirical hazard distributions across contracts, services, and tenure.' },
    { method: 'GET', path: '/analytics/customers', desc: 'Paginated, searchable directory of actual Telco customers with feature vectors.' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Reference & Developer Specification"
        subtitle="Production-grade RESTful interface built with FastAPI, Pydantic v2 validation schemas, and automated Swagger/OpenAPI docs."
        action={
          <a
            href={`${API_URL}/docs`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyanAccent text-navy-950 text-xs font-mono font-bold hover:bg-cyan-300 transition-colors shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Swagger Interactive UI
          </a>
        }
      />

      {/* cURL Sandbox Card */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-navy-800">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-200">
            <Terminal className="h-4 w-4 text-cyanAccent" />
            <span>cURL Inference Snippet</span>
          </div>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-navy-800 hover:bg-navy-750 text-xs font-mono text-slate-300 border border-navy-700 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy cURL'}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-navy-950 border border-navy-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed shadow-inner">
          {sampleCurl}
        </pre>
      </Card>

      {/* Endpoints Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-navy-800 bg-navy-900/40">
          <h3 className="font-heading font-semibold text-sm text-slate-200 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-cyanAccent" />
            Available REST Endpoints
          </h3>
        </div>

        <div className="divide-y divide-navy-800/60 text-xs">
          {ENDPOINTS.map((ep, idx) => (
            <div
              key={idx}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-navy-850/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    ep.method === 'POST'
                      ? 'bg-cyanAccent/15 text-cyanAccent border border-cyanAccent/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="font-mono font-semibold text-slate-200">{ep.path}</span>
              </div>
              <span className="text-slate-400 font-sans text-xs sm:text-right">{ep.desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import MetricCard from '../components/MetricCard';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Users,
  AlertTriangle,
  FileCheck
} from 'lucide-react';

export default function Batch() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUploadAndScore = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.predictBatch(file, null);
      setSummary(data.summary);
      setPreview(data.preview || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Batch processing failed. Ensure CSV matches Telco schema.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!file) return;
    // Download directly via window open or anchor
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${API_BASE_URL}/predict/batch?download_csv=true`;
    form.enctype = 'multipart/form-data';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.name = 'file';
    // Create FileList wrapper or use fetch blob
    fetch(`${API_BASE_URL}/predict/batch?download_csv=true`, {
      method: 'POST',
      body: (() => {
        const fd = new FormData();
        fd.append('file', file);
        return fd;
      })()
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `churnlens_scored_${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => console.error('Download error:', err));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Batch File Scoring & Pipeline Ingestion</h2>
        <p className="text-xs text-slate-400 mt-1">
          Upload multi-record CSV files for row-level schema validation, vectorized scoring, and exportable predictions.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors">
          <UploadCloud className="h-10 w-10 text-slate-500 mb-3" />
          <h3 className="text-sm font-semibold text-white">Upload Customer CSV</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Drag and drop your batch file here, or browse from your filesystem. Supports standard IBM Telco schema columns.
          </p>

          <input
            type="file"
            accept=".csv"
            id="csv-upload"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="mt-4 flex items-center gap-3">
            <label
              htmlFor="csv-upload"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
            >
              Browse CSV File
            </label>

            {file && (
              <button
                type="button"
                onClick={handleUploadAndScore}
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Validating & Scoring Batch...
                  </>
                ) : (
                  <>
                    <FileCheck className="h-3.5 w-3.5" />
                    Score {file.name}
                  </>
                )}
              </button>
            )}
          </div>

          {file && (
            <p className="text-xs text-emerald-400 mt-2 font-mono">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Batch Summary KPIs */}
      {summary && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Batch Scoring Summary</h3>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download Scored CSV
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <MetricCard
              title="Total Rows Ingested"
              value={summary.total_rows.toLocaleString()}
              subtitle={`${summary.valid_rows} valid (${(summary.valid_rate * 100).toFixed(1)}%)`}
              color="blue"
            />
            <MetricCard
              title="High Risk Accounts"
              value={summary.high_risk.toLocaleString()}
              subtitle="p >= 60%"
              color="rose"
            />
            <MetricCard
              title="Medium Risk Accounts"
              value={summary.medium_risk.toLocaleString()}
              subtitle="35% <= p < 60%"
              color="amber"
            />
            <MetricCard
              title="Low Risk Accounts"
              value={summary.low_risk.toLocaleString()}
              subtitle="p < 35%"
              color="emerald"
            />
            <MetricCard
              title="Mean Churn Probability"
              value={`${(summary.mean_probability * 100).toFixed(1)}%`}
              subtitle="Across all valid rows"
              color="blue"
            />
          </div>

          {/* Results Preview Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Inference Table Preview (Top 50 Records)</span>
              <span className="text-[11px] text-slate-400">Total Scored: {summary.scored_count}</span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Customer ID</th>
                    <th className="py-2.5 px-4">Contract</th>
                    <th className="py-2.5 px-4">Tenure</th>
                    <th className="py-2.5 px-4">Monthly ($)</th>
                    <th className="py-2.5 px-4">Churn Probability</th>
                    <th className="py-2.5 px-4">Risk Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {preview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/50">
                      <td className="py-2.5 px-4 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-200">{row.CustomerID || `ROW-${idx + 1}`}</td>
                      <td className="py-2.5 px-4">{row.Contract}</td>
                      <td className="py-2.5 px-4">{row['Tenure Months']} mos</td>
                      <td className="py-2.5 px-4 font-mono">${row['Monthly Charges']}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-white">
                        {row.churn_probability !== undefined && !isNaN(row.churn_probability)
                          ? `${(row.churn_probability * 100).toFixed(1)}%`
                          : 'N/A'}
                      </td>
                      <td className="py-2.5 px-4">
                        <RiskBadge tier={row.risk_tier} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

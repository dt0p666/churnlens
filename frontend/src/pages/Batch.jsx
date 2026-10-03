import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Users,
  AlertCircle,
  FileCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';

const PIPELINE_STEPS = [
  { id: 1, label: 'Upload CSV' },
  { id: 2, label: 'Schema Validation' },
  { id: 3, label: 'Pipeline Scoring' },
  { id: 4, label: 'Audit & Export' },
];

export default function Batch() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [summary, setSummary] = useState(null);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (f) => {
    if (f && (f.name.endsWith('.csv') || f.type.includes('csv') || f.type.includes('text'))) {
      setFile(f);
      setError(null);
      setSummary(null);
      setPreview([]);
      setActiveStep(1);
    } else {
      setError('Please provide a valid CSV file.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndScore = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setActiveStep(2);

    try {
      // Simulate fast validation step transition
      await new Promise(r => setTimeout(r, 400));
      setActiveStep(3);

      const data = await api.predictBatch(file, null);
      
      await new Promise(r => setTimeout(r, 400));
      setActiveStep(4);

      setSummary(data.summary);
      setPreview(data.preview || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Batch processing failed. Ensure CSV matches Telco schema.');
      setActiveStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!file) return;
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const fd = new FormData();
    fd.append('file', file);

    fetch(`${API_BASE_URL}/predict/batch?download_csv=true`, {
      method: 'POST',
      body: fd,
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `churnlens_scored_${file.name}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => console.error('Download error:', err));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batch Scoring & Pipeline Ingestion"
        subtitle="Vectorized scoring of multi-record customer datasets with row-level quarantine validation and audit enrichment."
      />

      {/* Animated Pipeline Steps Tracker */}
      <Card className="p-4 bg-navy-900/60 backdrop-blur-md">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCompleted = summary ? true : activeStep > step.id;
            const isCurrent = loading && activeStep === step.id;
            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-navy-950 shadow-md shadow-emerald-500/20'
                        : isCurrent
                        ? 'bg-cyanAccent text-navy-950 animate-pulse shadow-md shadow-cyanAccent/30'
                        : 'bg-navy-950 border border-navy-700 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                  </div>
                  <span
                    className={`text-xs font-mono hidden sm:inline ${
                      isCompleted || isCurrent ? 'text-slate-200 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 transition-colors ${
                      isCompleted ? 'bg-emerald-500/60' : 'bg-navy-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* Drag & Drop Upload Zone */}
      <Card className="p-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
            isDragging
              ? 'border-cyanAccent bg-cyanAccent/5'
              : 'border-navy-700 hover:border-slate-500 bg-navy-950/40'
          }`}
        >
          <UploadCloud className={`h-12 w-12 mb-3 transition-transform ${isDragging ? 'text-cyanAccent scale-110' : 'text-slate-400'}`} />
          <h3 className="font-heading font-semibold text-sm text-slate-200">
            {file ? file.name : 'Upload Batch CSV File'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {file
              ? `File size: ${(file.size / 1024).toFixed(1)} KB — Ready to score.`
              : 'Drag and drop your file here, or click browse below. Expects standard Telco customer features.'}
          </p>

          <div className="mt-4 flex items-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
              <span className="px-4 py-2 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-200 font-mono text-xs border border-navy-700 transition-colors inline-block">
                Browse Files
              </span>
            </label>

            {file && (
              <Button
                variant="primary"
                onClick={handleUploadAndScore}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-navy-950" />
                    Executing Model Batch...
                  </>
                ) : (
                  <>
                    <FileCheck className="h-4 w-4" />
                    Execute Batch Scoring
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </Card>

      {/* Batch Summary KPI Tiles */}
      {summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Records"
              value={summary.total_records.toLocaleString()}
              subtitle="Rows evaluated"
              icon={Users}
            />
            <StatCard
              title="Cleanly Scored"
              value={summary.scored_records.toLocaleString()}
              subtitle="Passed validation"
              icon={CheckCircle2}
            />
            <StatCard
              title="Flagged High Risk"
              value={summary.high_risk_count.toLocaleString()}
              subtitle={`${summary.scored_records > 0 ? ((summary.high_risk_count / summary.scored_records) * 100).toFixed(1) : 0}% of scored batch`}
              icon={AlertTriangle}
            />
            <StatCard
              title="Invalid / Skipped"
              value={summary.skipped_records.toLocaleString()}
              subtitle="Quarantined records"
              icon={ShieldAlert}
            />
          </div>

          {/* Results Table & Export Action */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-navy-800 flex items-center justify-between bg-navy-900/40">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-cyanAccent" />
                <h3 className="font-heading font-semibold text-sm text-slate-200">
                  Batch Output Preview
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  (Showing first {preview.length} rows)
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5 text-cyanAccent" />
                Download Scored CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy-950/70 border-b border-navy-800 text-slate-400 uppercase font-mono tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Customer ID</th>
                    <th className="py-3 px-4 font-semibold">Churn Prob</th>
                    <th className="py-3 px-4 font-semibold">Risk Tier</th>
                    <th className="py-3 px-4 font-semibold">Prediction</th>
                    <th className="py-3 px-4 font-semibold">Contract</th>
                    <th className="py-3 px-4 font-semibold">Tenure</th>
                    <th className="py-3 px-4 font-semibold">Monthly</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/60 font-sans">
                  {preview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-navy-850/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">
                        {row.CustomerID || row.customerID || `Row-${idx + 1}`}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-cyanAccent">
                        {(row.churn_probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={row.risk_tier?.toLowerCase() || 'medium'}>
                          {row.risk_tier}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {row.churn_prediction === 1 ? (
                          <span className="text-rose-400 font-semibold">CHURN</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">RETAIN</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {row.Contract || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {row['Tenure Months'] ?? row.tenure ?? 'N/A'}m
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-200">
                        ${Number(row['Monthly Charges'] ?? row.MonthlyCharges ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

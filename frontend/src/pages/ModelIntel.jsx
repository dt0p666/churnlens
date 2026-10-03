import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Award, 
  Layers, 
  Activity, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  GitBranch,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  ReferenceLine,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { api } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import ChartCard from '../components/common/ChartCard';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';

export default function ModelIntel() {
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interactive threshold state
  const [selectedThreshold, setSelectedThreshold] = useState(0.45);

  useEffect(() => {
    api.getModelInfo()
      .then((res) => {
        setModelData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load model specs:', err);
        setError('Failed to load model intelligence telemetry.');
        setLoading(false);
      });
  }, []);

  const meta = modelData?.metadata;
  const cvResults = meta?.cv_results || {};
  const featureImportances = (modelData?.feature_importances || []).slice(0, 12);
  const rocPoints = modelData?.curves?.roc_curve || [];
  const prPoints = modelData?.curves?.pr_curve || [];
  const thresholds = modelData?.thresholds || [];

  // Find nearest threshold entry from threshold_analysis
  const activeThreshData = thresholds.reduce((prev, curr) => {
    return Math.abs(curr.threshold - selectedThreshold) < Math.abs(prev.threshold - selectedThreshold)
      ? curr
      : prev;
  }, thresholds[0] || { threshold: 0.45, precision: 0.54, recall: 0.81, f1: 0.65, tp: 301, fp: 256, fn: 73, tn: 779 });

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Model Intelligence & Architecture" subtitle="Loading model telemetry..." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Model Intelligence & Diagnostic Architecture"
        subtitle="Complete cross-validation benchmarks, out-of-fold diagnostic curves, TreeSHAP feature rankings, and dynamic decision boundary tuning."
        action={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PRODUCTION READY &bull; XGBoost v1.0.0
            </span>
          </div>
        }
      />

      {/* Top Architecture Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Winning Model"
          value={meta?.model_name || 'XGBoost'}
          subtitle="scale_pos_weight = 2.77"
          icon={Award}
        />
        <StatCard
          title="5-Fold CV ROC-AUC"
          value={`${((cvResults.XGBoost?.cv_roc_auc_mean || 0.8622) * 100).toFixed(2)}%`}
          subtitle={`±${((cvResults.XGBoost?.cv_roc_auc_std || 0.0097) * 100).toFixed(2)}% variance`}
          icon={Layers}
        />
        <StatCard
          title="Optimal Threshold"
          value={`${((meta?.tuned_threshold || 0.45) * 100).toFixed(0)}%`}
          subtitle="F1-optimized decision boundary"
          icon={SlidersHorizontal}
        />
        <StatCard
          title="Test Recall @ 0.45"
          value={`${((activeThreshData.recall || 0.806) * 100).toFixed(1)}%`}
          subtitle="Captures 8/10 at-risk customers"
          icon={Activity}
        />
      </div>

      {/* Interactive Threshold Slider & Live 2x2 Confusion Matrix */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-navy-800">
          <div>
            <h3 className="font-heading font-semibold text-sm text-slate-100 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-cyanAccent" />
              Interactive Decision Threshold Simulator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Slide to observe how adjusting the decision boundary trades off customer capture (Recall) vs intervention cost (Precision).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">Current Boundary:</span>
            <span className="px-3 py-1 rounded-lg font-mono font-bold text-sm bg-cyanAccent/10 text-cyanAccent border border-cyanAccent/30">
              {(selectedThreshold * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Slider Input */}
        <div className="py-4">
          <input
            type="range"
            min="0.10"
            max="0.90"
            step="0.05"
            value={selectedThreshold}
            onChange={(e) => setSelectedThreshold(parseFloat(e.target.value))}
            className="w-full accent-cyanAccent cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
            <span>0.10 (Aggressive Intervention)</span>
            <span className="text-cyanAccent font-semibold">0.45 (Production F1 Peak)</span>
            <span>0.90 (Ultra-Conservative)</span>
          </div>
        </div>

        {/* Live Metrics readout & 2x2 Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2 pt-4 border-t border-navy-800/80">
          {/* Metrics Tiles */}
          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-navy-950/70 border border-navy-800 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Precision</span>
              <span className="text-lg font-mono font-bold text-cyanAccent">
                {(activeThreshData.precision * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Intervention accuracy</span>
            </div>
            <div className="p-3 rounded-xl bg-navy-950/70 border border-navy-800 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Recall</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                {(activeThreshData.recall * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Churners detected</span>
            </div>
            <div className="p-3 rounded-xl bg-navy-950/70 border border-navy-800 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">F1 Score</span>
              <span className="text-lg font-mono font-bold text-violetSecondary">
                {(activeThreshData.f1 * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Harmonic balance</span>
            </div>
          </div>

          {/* 2x2 Colored Confusion Matrix */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-750 flex flex-col justify-between">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>TRUE NEGATIVE (TN)</span>
                  <span className="text-emerald-400">Correct Retain</span>
                </div>
                <div className="text-lg font-bold text-slate-200 mt-2">{activeThreshData.tn}</div>
                <span className="text-[10px] text-slate-500">Correctly spared from campaign cost</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
                <div className="flex justify-between text-amber-300 text-[10px]">
                  <span>FALSE POSITIVE (FP)</span>
                  <span className="text-amber-400">False Alarm</span>
                </div>
                <div className="text-lg font-bold text-amber-300 mt-2">{activeThreshData.fp}</div>
                <span className="text-[10px] text-amber-400/70">Wasted discount or incentive cost</span>
              </div>

              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex flex-col justify-between">
                <div className="flex justify-between text-rose-300 text-[10px]">
                  <span>FALSE NEGATIVE (FN)</span>
                  <span className="text-rose-400">Missed Churner</span>
                </div>
                <div className="text-lg font-bold text-rose-300 mt-2">{activeThreshData.fn}</div>
                <span className="text-[10px] text-rose-400/70">Lost customer revenue (Critical error)</span>
              </div>

              <div className="p-3 rounded-lg bg-cyanAccent/10 border border-cyanAccent/30 flex flex-col justify-between">
                <div className="flex justify-between text-cyanAccent text-[10px]">
                  <span>TRUE POSITIVE (TP)</span>
                  <span className="text-cyanAccent font-semibold">Saved Customer</span>
                </div>
                <div className="text-lg font-bold text-cyanAccent mt-2">{activeThreshData.tp}</div>
                <span className="text-[10px] text-cyanAccent/70">Identified and rescued in time</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Diagnostic Curves: ROC Curve & PR Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curve */}
        <ChartCard
          title="Receiver Operating Characteristic (ROC)"
          subtitle={`AUC = ${(meta?.test_metrics_default_05?.roc_auc || 0.855).toFixed(4)} &bull; True Positive vs False Positive Tradeoff`}
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocPoints} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="fpr"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(v) => v.toFixed(2)}
                  label={{ value: 'False Positive Rate (FPR)', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }}
                />
                <YAxis
                  dataKey="tpr"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(v) => v.toFixed(2)}
                  label={{ value: 'True Positive Rate (TPR)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-navy-950 border border-navy-700 p-2 rounded-lg text-xs font-mono shadow-xl">
                        <p className="text-cyanAccent">TPR (Recall): {(d.tpr * 100).toFixed(1)}%</p>
                        <p className="text-slate-400">FPR: {(d.fpr * 100).toFixed(1)}%</p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tpr"
                  stroke="#22D3EE"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#22D3EE' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Precision-Recall Curve */}
        <ChartCard
          title="Precision-Recall Curve (PR)"
          subtitle={`PR-AUC = ${(meta?.test_metrics_default_05?.pr_auc || 0.669).toFixed(4)} &bull; Imbalanced Positive Class Performance`}
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prPoints} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="recall"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(v) => v.toFixed(2)}
                  label={{ value: 'Recall', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }}
                />
                <YAxis
                  dataKey="precision"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(v) => v.toFixed(2)}
                  label={{ value: 'Precision', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-navy-950 border border-navy-700 p-2 rounded-lg text-xs font-mono shadow-xl">
                        <p className="text-violetSecondary">Precision: {(d.precision * 100).toFixed(1)}%</p>
                        <p className="text-slate-400">Recall: {(d.recall * 100).toFixed(1)}%</p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="precision"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Feature Importance & Model Comparison Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feature Importance Bar Chart */}
        <div className="lg:col-span-7">
          <ChartCard
            title="Global Feature Importance"
            subtitle="Top tree split gain contributions across XGBoost estimators"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={featureImportances}
                  margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(v) => v.toFixed(2)}
                  />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    stroke="#64748B"
                    tick={{ fill: '#CBD5E1', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    width={130}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-navy-950 border border-navy-700 p-2 rounded-lg text-xs font-mono shadow-xl">
                          <p className="text-slate-200 font-bold">{d.feature}</p>
                          <p className="text-cyanAccent">Gain Importance: {d.importance.toFixed(4)}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="importance" fill="#22D3EE" radius={[0, 4, 4, 0]}>
                    {featureImportances.map((_, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={idx < 3 ? '#22D3EE' : idx < 7 ? '#8B5CF6' : '#3B82F6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* 5-Fold CV Model Benchmark Table */}
        <div className="lg:col-span-5">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="font-heading font-semibold text-sm text-slate-100 flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-cyanAccent" />
                Stratified 5-Fold CV Leaderboard
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 mb-4">
                Strict out-of-fold benchmark across all 4 candidate model pipelines.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-navy-950 border-b border-navy-800 text-slate-400 font-mono">
                    <tr>
                      <th className="py-2.5 px-3">Estimator</th>
                      <th className="py-2.5 px-3">ROC-AUC</th>
                      <th className="py-2.5 px-3">PR-AUC</th>
                      <th className="py-2.5 px-3">Recall</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-800 font-mono">
                    {Object.entries(cvResults).map(([mName, scores]) => {
                      const isWinner = mName === meta?.model_name;
                      return (
                        <tr
                          key={mName}
                          className={`hover:bg-navy-850/40 transition-colors ${
                            isWinner ? 'bg-cyanAccent/10 font-semibold' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 flex items-center gap-1.5 text-slate-200">
                            {isWinner && <Award className="h-3 w-3 text-cyanAccent" />}
                            {mName}
                          </td>
                          <td className="py-2.5 px-3 text-cyanAccent">
                            {(scores.cv_roc_auc_mean * 100).toFixed(2)}%
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {(scores.cv_pr_auc_mean * 100).toFixed(2)}%
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {(scores.cv_recall_mean * 100).toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-navy-950 border border-navy-800 flex items-start gap-2 text-[10px] text-slate-400">
              <Info className="h-3.5 w-3.5 text-cyanAccent flex-shrink-0 mt-0.5" />
              <span>
                Zero Data Leakage guarantee: Standard scalers and target encodings fitted strictly inside each cross-validation fold.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

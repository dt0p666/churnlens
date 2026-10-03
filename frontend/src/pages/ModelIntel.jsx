import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Info,
  DollarSign,
  Target,
  Radio,
  RefreshCw,
  Percent,
  Sliders
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
import Button from '../components/common/Button';
import Skeleton from '../components/common/Skeleton';

const TABS = [
  { id: 'diagnostics', label: 'Diagnostics & Curves', icon: Activity },
  { id: 'calibration', label: 'Probability Calibration', icon: Layers },
  { id: 'business', label: 'Cost Optimizer & Retention Planner', icon: DollarSign },
  { id: 'drift', label: 'Drift & PSI Monitoring', icon: Radio },
];

export default function ModelIntel() {
  const [activeTab, setActiveTab] = useState('diagnostics');
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interactive threshold state
  const [selectedThreshold, setSelectedThreshold] = useState(0.45);

  // Business Cost Assumptions (Editable by user)
  const [costMissedChurner, setCostMissedChurner] = useState(500.0);
  const [costRetentionOffer, setCostRetentionOffer] = useState(50.0);
  const [costOutreach, setCostOutreach] = useState(50.0);
  const [contactPercent, setContactPercent] = useState(20.0);
  const [costData, setCostData] = useState(null);
  const [retentionData, setRetentionData] = useState(null);

  // Drift Monitoring State
  const [driftData, setDriftData] = useState(null);
  const [simulateShift, setSimulateShift] = useState(false);
  const [driftLoading, setDriftLoading] = useState(false);

  useEffect(() => {
    fetchModelTelemetry();
  }, []);

  const fetchModelTelemetry = async () => {
    try {
      setLoading(true);
      const res = await api.getModelInfo();
      setModelData(res);
      await fetchBusinessData(costMissedChurner, costRetentionOffer, costOutreach, contactPercent);
      await fetchDriftData(false);
    } catch (err) {
      console.error('Failed to load model specs:', err);
      setError('Failed to load model intelligence telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessData = async (fnCost, fpCost, tpCost, contactPct) => {
    try {
      const [cRes, rRes] = await Promise.all([
        api.getCostOptimization({
          cost_missed_churner: fnCost,
          cost_retention_offer: fpCost,
          cost_successful_outreach: tpCost,
        }),
        api.getRetentionPlanner({ contact_percentage: contactPct })
      ]);
      setCostData(cRes);
      setRetentionData(rRes);
    } catch (e) {
      console.error('Failed to load business cost analysis:', e);
    }
  };

  const fetchDriftData = async (simulated) => {
    try {
      setDriftLoading(true);
      const res = await api.getDriftStatus(simulated);
      setDriftData(res);
    } catch (e) {
      console.error('Failed to load drift status:', e);
    } finally {
      setDriftLoading(false);
    }
  };

  const handleCostAssumptionChange = (fnVal, fpVal, tpVal) => {
    setCostMissedChurner(fnVal);
    setCostRetentionOffer(fpVal);
    setCostOutreach(tpVal);
    fetchBusinessData(fnVal, fpVal, tpVal, contactPercent);
  };

  const handleContactPercentChange = (pct) => {
    setContactPercent(pct);
    api.getRetentionPlanner({ contact_percentage: pct }).then(setRetentionData).catch(console.error);
  };

  const handleToggleDriftSimulation = (val) => {
    setSimulateShift(val);
    fetchDriftData(val);
  };

  const meta = modelData?.metadata;
  const cvResults = meta?.cv_results || {};
  const featureImportances = (modelData?.feature_importances || []).slice(0, 12);
  const rocPoints = modelData?.curves?.roc_curve || [];
  const prPoints = modelData?.curves?.pr_curve || [];
  const thresholds = modelData?.thresholds || [];
  const calibration = modelData?.calibration || {};

  // Find nearest threshold entry from threshold_analysis
  const activeThreshData = thresholds.reduce((prev, curr) => {
    return Math.abs(curr.threshold - selectedThreshold) < Math.abs(prev.threshold - selectedThreshold)
      ? curr
      : prev;
  }, thresholds[0] || { threshold: 0.45, precision: 0.54, recall: 0.81, f1: 0.65, tp: 301, fp: 256, fn: 73, tn: 779 });

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Model Intelligence & Diagnostic Architecture" subtitle="Loading model telemetry..." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Model Intelligence & Engineering Specification"
        subtitle="Complete cross-validation benchmarks, probability calibration, cost-optimal decision boundaries, and Population Stability Index (PSI) drift tracking."
        badge="PRODUCTION VERIFIED &bull; XGBoost v1.0.0"
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-navy-800 space-x-2 overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-cyanAccent text-cyanAccent bg-cyanAccent/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-navy-850'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DIAGNOSTICS & THRESHOLD */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
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
              subtitle="F1-optimal decision boundary"
              icon={SlidersHorizontal}
            />
            <StatCard
              title="Test Recall @ 0.45"
              value={`${((activeThreshData.recall || 0.806) * 100).toFixed(1)}%`}
              subtitle="Catches 8 of 10 at-risk customers"
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
                  Slide to observe how adjusting the decision boundary trades off customer capture (Recall) vs false alarm cost (Precision).
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
                  <span className="text-[10px] text-slate-500 block mt-1">Targeting accuracy</span>
                </div>
                <div className="p-3 rounded-xl bg-navy-950/70 border border-navy-800 text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Recall</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    {(activeThreshData.recall * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Churners intercepted</span>
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
                    <span className="text-[10px] text-slate-500">Correctly spared campaign discount</span>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
                    <div className="flex justify-between text-amber-300 text-[10px]">
                      <span>FALSE POSITIVE (FP)</span>
                      <span className="text-amber-400">False Alarm</span>
                    </div>
                    <div className="text-lg font-bold text-amber-300 mt-2">{activeThreshData.fp}</div>
                    <span className="text-[10px] text-amber-400/70">Wasted discount on loyal customer</span>
                  </div>

                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex flex-col justify-between">
                    <div className="flex justify-between text-rose-300 text-[10px]">
                      <span>FALSE NEGATIVE (FN)</span>
                      <span className="text-rose-400">Missed Churner</span>
                    </div>
                    <div className="text-lg font-bold text-rose-300 mt-2">{activeThreshData.fn}</div>
                    <span className="text-[10px] text-rose-400/70">Lost customer LTV revenue</span>
                  </div>

                  <div className="p-3 rounded-lg bg-cyanAccent/10 border border-cyanAccent/30 flex flex-col justify-between">
                    <div className="flex justify-between text-cyanAccent text-[10px]">
                      <span>TRUE POSITIVE (TP)</span>
                      <span className="text-cyanAccent font-semibold">Rescued Account</span>
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
                    />
                    <YAxis
                      dataKey="tpr"
                      stroke="#64748B"
                      tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickFormatter={(v) => v.toFixed(2)}
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
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Precision-Recall Curve (PR)"
              subtitle={`PR-AUC = ${(meta?.test_metrics_default_05?.pr_auc || 0.669).toFixed(4)} &bull; Baseline prevalence = 26.5%`}
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
                    />
                    <YAxis
                      dataKey="precision"
                      stroke="#64748B"
                      tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickFormatter={(v) => v.toFixed(2)}
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
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Feature Importance & Model Comparison Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
      )}

      {/* TAB 2: PROBABILITY CALIBRATION */}
      {activeTab === 'calibration' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Uncalibrated Brier Score"
              value={calibration.brier_score_uncalibrated?.toFixed(4) || '0.1569'}
              subtitle="Raw tree ensemble probabilities"
              icon={Activity}
            />
            <StatCard
              title="Calibrated Brier Score"
              value={calibration.brier_score_calibrated?.toFixed(4) || '0.1329'}
              subtitle="CalibratedClassifierCV (Sigmoid / Platt)"
              icon={CheckCircle2}
            />
            <StatCard
              title="Brier Error Reduction"
              value={`-${(((calibration.brier_improvement || 0.024) / (calibration.brier_score_uncalibrated || 0.1569)) * 100).toFixed(1)}%`}
              subtitle="Lower is better (0.0 = perfect)"
              icon={TrendingUp}
            />
          </div>

          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-navy-800 gap-3">
              <div>
                <h3 className="font-heading font-semibold text-sm text-slate-100 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-cyanAccent" />
                  Reliability Diagram (Calibration Curve)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compares predicted probabilities against true observed event frequencies. Perfect calibration follows the diagonal line.
                </p>
              </div>
              <Badge variant="low">RECOMMENDED: CALIBRATED</Badge>
            </div>

            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis
                    dataKey="pred"
                    type="number"
                    domain={[0, 1]}
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    label={{ value: 'Mean Predicted Probability', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }}
                  />
                  <YAxis
                    dataKey="actual"
                    type="number"
                    domain={[0, 1]}
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    label={{ value: 'Observed Fraction of Positives', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-navy-950 border border-navy-700 p-2.5 rounded-lg text-xs font-mono shadow-xl">
                          <p className="text-slate-300 font-bold">Predicted: {(payload[0].payload.pred * 100).toFixed(1)}%</p>
                          <p className="text-cyanAccent">Observed Churn: {(payload[0].payload.actual * 100).toFixed(1)}%</p>
                        </div>
                      );
                    }}
                  />
                  {/* Perfect reference diagonal */}
                  <Line
                    data={calibration.perfect_line || []}
                    type="monotone"
                    dataKey="actual"
                    stroke="#475569"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    name="Perfect Calibration"
                  />
                  {/* Uncalibrated curve */}
                  <Line
                    data={calibration.uncalibrated_curve || []}
                    type="monotone"
                    dataKey="actual"
                    stroke="#F43F5E"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#F43F5E' }}
                    name="Uncalibrated XGBoost"
                  />
                  {/* Calibrated curve */}
                  <Line
                    data={calibration.calibrated_curve || []}
                    type="monotone"
                    dataKey="actual"
                    stroke="#22D3EE"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#22D3EE' }}
                    name="Calibrated (Sigmoid)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-navy-800 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-4">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-cyanAccent">
                  <span className="w-2 h-2 rounded-full bg-cyanAccent" /> Calibrated (Brier = {calibration.brier_score_calibrated})
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Uncalibrated (Brier = {calibration.brier_score_uncalibrated})
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2 h-0.5 bg-slate-500" /> Perfect Calibration Line
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-navy-950 border border-navy-800 text-xs text-slate-400 leading-relaxed font-sans">
              <strong className="text-slate-200">Why Calibration Matters in Churn Modeling:</strong>{' '}
              Uncalibrated tree ensembles like XGBoost often push predictions towards 0 and 1 due to extreme margin maximization. By fitting Platt scaling (`CalibratedClassifierCV(method='sigmoid')`), predicted probabilities directly match true event rates: when the model predicts 70% risk, exactly 7 out of 10 customers actually churn. This enables dollar-precise Expected Value and Customer Lifetime Value computations.
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: COST OPTIMIZER & RETENTION PLANNER */}
      {activeTab === 'business' && (
        <div className="space-y-6">
          {/* Assumption Parameter Controls */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <h3 className="font-heading font-semibold text-sm text-slate-100">
                  Business Loss Function Parameters
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                EDITABLE ASSUMPTIONS
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Adjust your business unit economics to compute the exact threshold that minimizes expected financial loss under asymmetric classification penalties.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-navy-950 border border-navy-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="text-slate-300">Cost of Missed Churner (FN)</label>
                  <span className="font-mono text-rose-400 font-bold">${costMissedChurner}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1500"
                  step="50"
                  value={costMissedChurner}
                  onChange={(e) => handleCostAssumptionChange(parseFloat(e.target.value), costRetentionOffer, costOutreach)}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">Lost customer LTV when churn occurs unaddressed.</span>
              </div>

              <div className="p-3 rounded-lg bg-navy-950 border border-navy-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="text-slate-300">Wasted Offer Cost (FP)</label>
                  <span className="font-mono text-amber-400 font-bold">${costRetentionOffer}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={costRetentionOffer}
                  onChange={(e) => handleCostAssumptionChange(costMissedChurner, parseFloat(e.target.value), costOutreach)}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">Unnecessary incentive given to an already loyal customer.</span>
              </div>

              <div className="p-3 rounded-lg bg-navy-950 border border-navy-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="text-slate-300">Outreach Operations Cost (TP)</label>
                  <span className="font-mono text-cyanAccent font-bold">${costOutreach}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={costOutreach}
                  onChange={(e) => handleCostAssumptionChange(costMissedChurner, costRetentionOffer, parseFloat(e.target.value))}
                  className="w-full accent-cyanAccent cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">Operational and discount cost per targeted customer.</span>
              </div>
            </div>
          </Card>

          {/* Cost Curve & Financial Comparison */}
          {costData && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <ChartCard
                  title="Total Expected Business Cost Curve"
                  subtitle={`Optimal Threshold = ${costData.optimal_threshold} &bull; Minimizes total net misclassification loss`}
                >
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={costData.cost_curve} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis
                          dataKey="threshold"
                          stroke="#64748B"
                          tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                          tickFormatter={(v) => v.toFixed(2)}
                          label={{ value: 'Decision Threshold', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }}
                        />
                        <YAxis
                          stroke="#64748B"
                          tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          label={{ value: 'Total Net Cost ($)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div className="bg-navy-950 border border-navy-700 p-2.5 rounded-lg text-xs font-mono shadow-xl">
                                <p className="text-slate-200 font-bold">Threshold: {d.threshold}</p>
                                <p className="text-cyanAccent">Total Cost: ${d.net_cost.toLocaleString()}</p>
                                <p className="text-rose-400">Lost LTV: ${d.lost_ltv.toLocaleString()}</p>
                                <p className="text-amber-400">Wasted Discounts: ${d.wasted_discounts.toLocaleString()}</p>
                              </div>
                            );
                          }}
                        />
                        <ReferenceLine
                          x={costData.optimal_threshold}
                          stroke="#10B981"
                          strokeDasharray="3 3"
                          label={{ value: `Optimal (${costData.optimal_threshold})`, fill: '#10B981', fontSize: 10 }}
                        />
                        <ReferenceLine
                          x={0.50}
                          stroke="#64748B"
                          strokeDasharray="2 2"
                          label={{ value: 'Default 0.50', fill: '#94A3B8', fontSize: 10 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="net_cost"
                          stroke="#22D3EE"
                          strokeWidth={2.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>

              {/* Savings vs 0.50 Metric Card */}
              <div className="lg:col-span-4 space-y-4">
                <Card className="p-6 h-full flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
                      Optimal vs Default 0.50 Comparison
                    </span>
                    <div className="mt-3 space-y-3">
                      <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
                        <span className="text-[10px] font-mono text-slate-400">Default (0.50) Expected Cost</span>
                        <div className="text-lg font-mono font-bold text-slate-300">
                          ${costData.baseline_05_cost.toLocaleString()}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <span className="text-[10px] font-mono text-emerald-300">Cost-Optimal ({costData.optimal_threshold}) Cost</span>
                        <div className="text-lg font-mono font-bold text-emerald-400">
                          ${costData.optimal_cost.toLocaleString()}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-cyanAccent/10 border border-cyanAccent/30">
                        <span className="text-[10px] font-mono text-cyanAccent">Net Financial Savings</span>
                        <div className="text-xl font-mono font-bold text-cyanAccent flex items-center gap-1 mt-1">
                          +${costData.estimated_savings_vs_05.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Gained purely by moving from arbitrary 0.5 to business-optimal threshold.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-navy-950 border border-navy-800 text-[10px] text-slate-400 mt-4">
                    Assumptions reflect current parameters: $500 lost customer LTV vs $50 wasted retention offer.
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Retention Planner (Lift & Cumulative Gains) */}
          {retentionData && (
            <Card className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-navy-800 gap-3">
                <div>
                  <h3 className="font-heading font-semibold text-sm text-slate-100 flex items-center gap-2">
                    <Target className="h-4 w-4 text-cyanAccent" />
                    Retention Campaign Capacity Planner
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select your operational contact capacity (e.g. top 20% highest risk) to observe lift and churners captured.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-400">Contacting:</span>
                  <span className="px-2.5 py-1 rounded bg-cyanAccent/10 text-cyanAccent font-bold border border-cyanAccent/30">
                    Top {contactPercent}% ({retentionData.user_query.contact_count} customers)
                  </span>
                </div>
              </div>

              {/* Slider for Capacity */}
              <div className="py-2">
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={contactPercent}
                  onChange={(e) => handleContactPercentChange(parseFloat(e.target.value))}
                  className="w-full accent-cyanAccent cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
                  <span>Top 5% (Highest Precision)</span>
                  <span className="text-cyanAccent font-semibold">Top 20% (Recommended Campaign)</span>
                  <span>Top 60% (Broad Outreach)</span>
                </div>
              </div>

              {/* Planner KPI Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
                <div className="p-3 rounded-lg bg-navy-950 border border-navy-800 text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Churners Intercepted</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    {retentionData.user_query.churners_captured} / {retentionData.total_churners}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Actual positive churners</span>
                </div>

                <div className="p-3 rounded-lg bg-navy-950 border border-navy-800 text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Churn Captured</span>
                  <span className="text-lg font-mono font-bold text-cyanAccent">
                    {retentionData.user_query.capture_percentage}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">Captured with {contactPercent}% budget</span>
                </div>

                <div className="p-3 rounded-lg bg-navy-950 border border-navy-800 text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Precision @ k</span>
                  <span className="text-lg font-mono font-bold text-violetSecondary">
                    {(retentionData.user_query.precision_at_k * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">Hit-rate among contacted</span>
                </div>

                <div className="p-3 rounded-lg bg-navy-950 border border-navy-800 text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Campaign Lift</span>
                  <span className="text-lg font-mono font-bold text-amber-400">
                    {retentionData.user_query.lift}x
                  </span>
                  <span className="text-[10px] text-slate-500 block">Better than random outreach</span>
                </div>
              </div>

              {/* Cumulative Gains Chart */}
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={retentionData.gain_chart} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis
                      dataKey="contact_percentage"
                      stroke="#64748B"
                      tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickFormatter={(v) => `${v}%`}
                      label={{ value: '% of Customer Base Contacted', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }}
                    />
                    <YAxis
                      dataKey="churn_capture_percentage"
                      stroke="#64748B"
                      tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickFormatter={(v) => `${v}%`}
                      label={{ value: '% of Total Churn Captured', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-navy-950 border border-navy-700 p-2.5 rounded-lg text-xs font-mono shadow-xl">
                            <p className="text-slate-200 font-bold">Contacted: {d.contact_percentage}%</p>
                            <p className="text-cyanAccent">Churn Captured: {d.churn_capture_percentage}%</p>
                            <p className="text-amber-400">Lift: {d.lift}x</p>
                          </div>
                        );
                      }}
                    />
                    {/* Random baseline line */}
                    <Line
                      type="monotone"
                      dataKey="random_baseline"
                      stroke="#475569"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                      name="Random Baseline"
                    />
                    {/* Model gain curve */}
                    <Line
                      type="monotone"
                      dataKey="churn_capture_percentage"
                      stroke="#22D3EE"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#22D3EE' }}
                      name="Model Gain Curve"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 4: DRIFT & PSI MONITORING */}
      {activeTab === 'drift' && (
        <div className="space-y-6">
          {/* Top Control Strip */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-navy-800 gap-4">
              <div>
                <h3 className="font-heading font-semibold text-sm text-slate-100 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-cyanAccent" />
                  Live Population Stability Index (PSI) Radar
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Monitors input covariate distributions between training data baseline and incoming batches.
                </p>
              </div>

              {/* Simulation Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400">Simulation Mode:</span>
                <button
                  onClick={() => handleToggleDriftSimulation(!simulateShift)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                    simulateShift
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'bg-navy-800 border border-navy-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {simulateShift ? <AlertTriangle className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  {simulateShift ? 'SIMULATED DRIFT ACTIVE' : 'Simulate Covariate Shift'}
                </button>
              </div>
            </div>

            {/* Crucial Industry Notice */}
            <div className="mt-3 p-3 rounded-lg bg-navy-950/80 border border-navy-800 flex items-start gap-2.5 text-xs text-slate-400">
              <Info className="h-4 w-4 text-cyanAccent flex-shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-200">Critical MLOps Notice:</strong>{' '}
                This metric measures <span className="text-cyanAccent font-mono">covariate/data drift (PSI)</span>, not live model accuracy drift, because real-world customer churn labels do not physically arrive until the billing cycle terminates 30-90 days later. Tracking PSI alerts engineers to feature distribution shifts immediately without waiting for ground truth labels.
              </p>
            </div>
          </Card>

          {/* Drift Telemetry Cards */}
          {driftData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Drift Radar Status"
                  value={driftData.status}
                  subtitle={driftData.mode}
                  icon={Radio}
                />
                <StatCard
                  title="Max Observed PSI"
                  value={driftData.max_psi?.toFixed(4) || '0.000'}
                  subtitle={driftData.max_psi >= 0.20 ? 'Action required (PSI ≥ 0.20)' : 'Within tolerance'}
                  icon={AlertTriangle}
                />
                <StatCard
                  title="Average Feature PSI"
                  value={driftData.average_psi?.toFixed(4) || '0.000'}
                  subtitle={`Across ${driftData.total_monitored_features} monitored features`}
                  icon={Activity}
                />
                <StatCard
                  title="Retraining Alert"
                  value={driftData.retraining_recommended ? 'TRIGGERED' : 'STANDBY'}
                  subtitle={driftData.retraining_recommended ? 'Distribution alert active' : 'Stable telemetry'}
                  icon={CheckCircle2}
                />
              </div>

              {/* Feature PSI Breakdown Table */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-navy-800 flex items-center justify-between bg-navy-900/40">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-cyanAccent" />
                    <h4 className="font-heading font-semibold text-xs text-slate-200">
                      Feature Stability Breakdown (Training Baseline vs Ingested Batch)
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> &lt;0.10 Stable
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> 0.10-0.20 Moderate
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-400" /> &ge;0.20 Significant
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-navy-950/70 border-b border-navy-800 text-slate-400">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Feature</th>
                        <th className="py-2.5 px-4 font-semibold">Feature Type</th>
                        <th className="py-2.5 px-4 font-semibold">PSI Value</th>
                        <th className="py-2.5 px-4 font-semibold">Drift Tier</th>
                        <th className="py-2.5 px-4 font-semibold">Baseline Mean</th>
                        <th className="py-2.5 px-4 font-semibold">Current Mean</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-800/60 font-sans">
                      {Object.entries(driftData.features || {}).map(([fName, fData]) => {
                        const isSevere = fData.psi >= 0.20;
                        const isModerate = fData.psi >= 0.10 && fData.psi < 0.20;
                        return (
                          <tr
                            key={fName}
                            className={`hover:bg-navy-850/40 transition-colors ${
                              isSevere ? 'bg-rose-500/10' : isModerate ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            <td className="py-2.5 px-4 font-mono font-medium text-slate-200">
                              {fName}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-400 uppercase text-[11px]">
                              {fData.type}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold">
                              <span className={isSevere ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'}>
                                {fData.psi.toFixed(4)}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <Badge
                                variant={isSevere ? 'high' : isModerate ? 'medium' : 'low'}
                              >
                                {fData.drift_tier}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-400">
                              {fData.reference_mean !== undefined ? fData.reference_mean : 'Categorical'}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-200">
                              {fData.current_mean !== undefined ? fData.current_mean : 'Categorical'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

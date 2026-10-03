import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCheck, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  Info,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  ReferenceLine 
} from 'recharts';
import { api } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import RadialGauge from '../components/common/RadialGauge';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';

const HIGH_RISK_PRESET = {
  Gender: 'Female',
  'Senior Citizen': 'No',
  Partner: 'No',
  Dependents: 'No',
  'Tenure Months': 2,
  'Phone Service': 'Yes',
  'Multiple Lines': 'No',
  'Internet Service': 'Fiber optic',
  'Online Security': 'No',
  'Online Backup': 'No',
  'Device Protection': 'No',
  'Tech Support': 'No',
  'Streaming TV': 'Yes',
  'Streaming Movies': 'Yes',
  Contract: 'Month-to-month',
  'Paperless Billing': 'Yes',
  'Payment Method': 'Electronic check',
  'Monthly Charges': 95.8,
  'Total Charges': 191.6,
};

const LOW_RISK_PRESET = {
  Gender: 'Male',
  'Senior Citizen': 'No',
  Partner: 'Yes',
  Dependents: 'Yes',
  'Tenure Months': 60,
  'Phone Service': 'Yes',
  'Multiple Lines': 'Yes',
  'Internet Service': 'DSL',
  'Online Security': 'Yes',
  'Online Backup': 'Yes',
  'Device Protection': 'Yes',
  'Tech Support': 'Yes',
  'Streaming TV': 'No',
  'Streaming Movies': 'No',
  Contract: 'Two year',
  'Paperless Billing': 'No',
  'Payment Method': 'Credit card (automatic)',
  'Monthly Charges': 64.2,
  'Total Charges': 3852.0,
};

export default function Predict() {
  const [profile, setProfile] = useState(HIGH_RISK_PRESET);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
    }));
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.predictChurn(profile);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Inference error. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const shapFactors = (result?.explanation?.top_factors || result?.explanation?.top_contributing_features || []).map((f) => {
    const isIncrease = f.direction === 'INCREASES_RISK' || f.impact === 'INCREASES_RISK';
    return {
      name: f.feature,
      shap: f.shap_value,
      abs: Math.abs(f.shap_value),
      isRisk: isIncrease,
      label: isIncrease ? '+ Risk' : '- Risk',
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Single Customer Inference"
        subtitle="Individual customer risk evaluation and TreeSHAP attribution factor decomposition."
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Load Preset:</span>
            <button
              onClick={() => { setProfile(HIGH_RISK_PRESET); setResult(null); }}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
            >
              High Risk
            </button>
            <button
              onClick={() => { setProfile(LOW_RISK_PRESET); setResult(null); }}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
            >
              Low Risk
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Customer Input Parameters (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6">
            <form onSubmit={handlePredict} className="space-y-6">
              {/* Demographics */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-3 pb-1 border-b border-navy-800 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyanAccent" />
                  Demographics & Household
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Gender</label>
                    <select
                      name="Gender"
                      value={profile.Gender}
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Senior Citizen</label>
                    <select
                      name="Senior Citizen"
                      value={profile['Senior Citizen']}
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Partner</label>
                    <select
                      name="Partner"
                      value={profile.Partner}
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Dependents</label>
                    <select
                      name="Dependents"
                      value={profile.Dependents}
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Account & Billing */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-3 pb-1 border-b border-navy-800 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-violetSecondary" />
                  Contract & Financials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Contract Type</label>
                    <select
                      name="Contract"
                      value={profile.Contract}
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
                    >
                      <option value="Month-to-month">Month-to-month</option>
                      <option value="One year">One year</option>
                      <option value="Two year">Two year</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Tenure (Months)</label>
                    <input
                      type="number"
                      name="Tenure Months"
                      min="0"
                      max="72"
                      value={profile['Tenure Months']}
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Payment Method</label>
                    <select
                      name="Payment Method"
                      value={profile['Payment Method']}
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
                    >
                      <option value="Electronic check">Electronic check</option>
                      <option value="Mailed check">Mailed check</option>
                      <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                      <option value="Credit card (automatic)">Credit card (automatic)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Monthly Charges ($)</label>
                    <input
                      type="number"
                      step="0.05"
                      name="Monthly Charges"
                      value={profile['Monthly Charges']}
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Total Charges ($)</label>
                    <input
                      type="number"
                      step="0.05"
                      name="Total Charges"
                      value={profile['Total Charges']}
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Paperless Billing</label>
                    <select
                      name="Paperless Billing"
                      value={profile['Paperless Billing']}
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Services & Connectivity */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-3 pb-1 border-b border-navy-800 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyanAccent" />
                  Services & Add-ons
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Internet Service</label>
                    <select
                      name="Internet Service"
                      value={profile['Internet Service']}
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
                    >
                      <option value="Fiber optic">Fiber optic</option>
                      <option value="DSL">DSL</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Online Security</label>
                    <select
                      name="Online Security"
                      value={profile['Online Security']}
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Tech Support</label>
                    <select
                      name="Tech Support"
                      value={profile['Tech Support']}
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Online Backup</label>
                    <select
                      name="Online Backup"
                      value={profile['Online Backup']}
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Execute Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3 flex items-center justify-center gap-2 text-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-navy-950" />
                      Evaluating Neural Tree Weights...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 fill-navy-950" />
                      Run Production Inference
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Prediction & SHAP Results (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {error && (
            <Card className="p-4 border-rose-500/40 bg-rose-500/10">
              <div className="flex items-start gap-3 text-rose-300 text-xs">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-400" />
                <div>
                  <h4 className="font-semibold">Inference Engine Error</h4>
                  <p className="mt-1 text-rose-200">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {result ? (
            <div className="space-y-6">
              {/* Radial Gauge Card */}
              <Card className="p-6 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <Badge variant={result.risk_tier.toLowerCase()}>
                    {result.risk_tier} RISK
                  </Badge>
                </div>

                <div className="my-2">
                  <RadialGauge
                    value={result.churn_probability}
                    riskTier={result.risk_tier}
                    size={220}
                  />
                </div>

                <div className="w-full mt-4 pt-4 border-t border-navy-800 grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-navy-950/60 border border-navy-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Model Verdict</span>
                    <span className="text-xs font-mono font-bold text-slate-100">
                      {result.churn_prediction === 1 ? 'PREDICT CHURN' : 'PREDICT RETAIN'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-navy-950/60 border border-navy-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Decision Threshold</span>
                    <span className="text-xs font-mono font-bold text-cyanAccent">
                      {(result.decision_threshold * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </Card>

              {/* Horizontal Diverging SHAP Bar Chart */}
              {shapFactors.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-cyanAccent" />
                        SHAP Feature Attribution
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Diverging local impact (TreeSHAP log-odds)
                      </p>
                    </div>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={shapFactors}
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                      >
                        <XAxis
                          type="number"
                          stroke="#64748B"
                          tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                          tickFormatter={(v) => v.toFixed(2)}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#64748B"
                          tick={{ fill: '#CBD5E1', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                          width={110}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div className="bg-navy-950 border border-navy-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                                <p className="text-slate-300 font-bold">{d.name}</p>
                                <p className={d.isRisk ? 'text-rose-400' : 'text-cyanAccent'}>
                                  SHAP Value: {d.shap > 0 ? `+${d.shap.toFixed(4)}` : d.shap.toFixed(4)}
                                </p>
                                <p className="text-slate-400 text-[10px]">
                                  {d.isRisk ? 'Increases churn probability' : 'Lowers churn probability'}
                                </p>
                              </div>
                            );
                          }}
                        />
                        <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
                        <Bar dataKey="shap" radius={[4, 4, 4, 4]}>
                          {shapFactors.map((entry, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={entry.isRisk ? '#F43F5E' : '#22D3EE'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 pt-3 border-t border-navy-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <span className="w-2 h-2 rounded bg-rose-500" /> Pushes Risk Up
                    </span>
                    <span className="flex items-center gap-1.5 text-cyanAccent">
                      <span className="w-2 h-2 rounded bg-cyanAccent" /> Reduces Risk
                    </span>
                  </div>

                  <div className="mt-3 p-2.5 rounded bg-navy-950/80 border border-navy-800 flex items-start gap-2 text-[10px] text-slate-400">
                    <Info className="h-3.5 w-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span>
                      Attribution reflects mathematical model sensitivity for this customer, not real-world causal certainty.
                    </span>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card className="p-8 h-96 flex flex-col items-center justify-center text-center">
              <EmptyState
                icon={Sparkles}
                title="Awaiting Execution"
                description="Configure the customer parameters on the left or select a preset, then click 'Run Production Inference'."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

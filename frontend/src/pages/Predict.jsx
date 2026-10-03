import React, { useState } from 'react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { 
  UserCheck, 
  Sparkles, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Info,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

const INITIAL_PROFILE = {
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

const LOW_RISK_PROFILE = {
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
  const [profile, setProfile] = useState(INITIAL_PROFILE);
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

  const shapChartData = result?.explanation?.top_factors?.map((f) => ({
    name: f.feature,
    shap: f.shap_value,
    abs: Math.abs(f.shap_value),
    direction: f.direction,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Single Customer Inference & SHAP Attribution</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate individual customer churn risk and analyze local feature contributions.
          </p>
        </div>

        {/* Preset Loaders */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Quick Presets:</span>
          <button
            type="button"
            onClick={() => setProfile(INITIAL_PROFILE)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
          >
            High Risk Sample
          </button>
          <button
            type="button"
            onClick={() => setProfile(LOW_RISK_PROFILE)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
          >
            Low Risk Sample
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <form onSubmit={handlePredict} className="space-y-6">
            {/* Section 1: Demographics */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-800 pb-2">
                1. Customer Demographics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                  <select
                    name="Gender"
                    value={profile.Gender}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Senior Citizen</label>
                  <select
                    name="Senior Citizen"
                    value={profile['Senior Citizen']}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Partner</label>
                  <select
                    name="Partner"
                    value={profile.Partner}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Dependents</label>
                  <select
                    name="Dependents"
                    value={profile.Dependents}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Account & Contract */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-800 pb-2">
                2. Account & Contract
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    name="Tenure Months"
                    min="0"
                    max="100"
                    value={profile['Tenure Months']}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contract Type</label>
                  <select
                    name="Contract"
                    value={profile.Contract}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Month-to-month">Month-to-month</option>
                    <option value="One year">One year</option>
                    <option value="Two year">Two year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
                  <select
                    name="Payment Method"
                    value={profile['Payment Method']}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Electronic check">Electronic check</option>
                    <option value="Mailed check">Mailed check</option>
                    <option value="Bank transfer (automatic)">Bank transfer (auto)</option>
                    <option value="Credit card (automatic)">Credit card (auto)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Subscribed Services */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-800 pb-2">
                3. Subscribed Services
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Internet</label>
                  <select
                    name="Internet Service"
                    value={profile['Internet Service']}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Fiber optic">Fiber optic</option>
                    <option value="DSL">DSL</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tech Support</label>
                  <select
                    name="Tech Support"
                    value={profile['Tech Support']}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="No internet service">No internet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Online Security</label>
                  <select
                    name="Online Security"
                    value={profile['Online Security']}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="No internet service">No internet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Paperless Bill</label>
                  <select
                    name="Paperless Billing"
                    value={profile['Paperless Billing']}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Billing Figures */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-800 pb-2">
                4. Billing Amounts
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Charges ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="Monthly Charges"
                    value={profile['Monthly Charges']}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Total Charges ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="Total Charges"
                    value={profile['Total Charges']}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-semibold text-white text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Computing Risk & SHAP Values...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Score Customer Risk & Explain
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction & Explainability Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Result Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Model Output</h3>

            {result ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Risk Assessment</span>
                  <RiskBadge tier={result.risk_tier} />
                </div>

                <div className="flex flex-col items-center justify-center py-4 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-4xl font-extrabold text-white tracking-tight">
                    {(result.churn_probability * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400 mt-1">Calibrated Churn Probability</span>

                  <div className="w-48 h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        result.churn_probability >= 0.6
                          ? 'bg-rose-500'
                          : result.churn_probability >= 0.35
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${result.churn_probability * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                  <div className="text-slate-400">
                    Threshold: <span className="text-slate-200 font-mono">{result.decision_threshold}</span>
                  </div>
                  <div className="text-slate-400">
                    Decision: <span className="text-slate-200 font-medium">{result.churn_prediction === 1 ? 'High Risk' : 'Retained'}</span>
                  </div>
                  <div className="text-slate-400">
                    Model: <span className="text-slate-200 font-mono">{result.model_name}</span>
                  </div>
                  <div className="text-slate-400">
                    Version: <span className="text-slate-200 font-mono">{result.model_version}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center text-slate-500">
                <UserCheck className="h-8 w-8 mb-2 stroke-1 text-slate-600" />
                <p className="text-xs">Submit the form to compute churn probability and SHAP attribution.</p>
              </div>
            )}
          </div>

          {/* SHAP Factor Breakdown */}
          {result?.explanation && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Local SHAP Feature Attribution</h3>
                <span className="text-[10px] text-slate-400 font-mono">TreeSHAP</span>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                Quantifies individual feature contributions to the prediction relative to the baseline customer.
              </p>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shapChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" stroke="#64748b" fontSize={10} />
                    <YAxis dataKey="name" type="category" width={110} stroke="#64748b" fontSize={10} />
                    <Tooltip
                      formatter={(val, name, props) => [
                        `${val > 0 ? '+' : ''}${val} (${props.payload.direction})`,
                        'SHAP Impact'
                      ]}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    />
                    <Bar dataKey="shap">
                      {shapChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.direction === 'increases_risk' ? '#f43f5e' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Causality Disclaimer */}
              <div className="mt-4 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Important Notice:</strong> SHAP values explain model associations, not causal real-world levers. Modifying contract terms in reality may have different elasticity effects.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

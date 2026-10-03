import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { 
  SlidersHorizontal, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  TrendingDown, 
  TrendingUp, 
  Info, 
  RotateCcw,
  ShieldCheck,
  Zap
} from 'lucide-react';

const DEFAULT_BASELINE = {
  Gender: 'Female',
  'Senior Citizen': 'No',
  Partner: 'No',
  Dependents: 'No',
  'Tenure Months': 3,
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
  'Monthly Charges': 92.5,
  'Total Charges': 277.5,
};

export default function WhatIf() {
  const [baseline, setBaseline] = useState(DEFAULT_BASELINE);
  const [simulated, setSimulated] = useState(DEFAULT_BASELINE);

  const [baselineResult, setBaselineResult] = useState(null);
  const [simulatedResult, setSimulatedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoSimulate, setAutoSimulate] = useState(true);

  // Compute baseline and initial simulated score
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      api.predictChurn(baseline),
      api.predictChurn(simulated)
    ]).then(([baseRes, simRes]) => {
      if (isMounted) {
        setBaselineResult(baseRes);
        setSimulatedResult(simRes);
        setLoading(false);
      }
    }).catch((err) => {
      console.error(err);
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const runSimulation = async (simProfile) => {
    setLoading(true);
    try {
      const res = await api.predictChurn(simProfile);
      setSimulatedResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimChange = (field, value) => {
    const updated = { ...simulated, [field]: value };
    // Adjust total charges automatically if tenure or monthly charges change
    if (field === 'Tenure Months' || field === 'Monthly Charges') {
      const tenure = field === 'Tenure Months' ? parseFloat(value) : simulated['Tenure Months'];
      const monthly = field === 'Monthly Charges' ? parseFloat(value) : simulated['Monthly Charges'];
      updated['Total Charges'] = Math.round(tenure * monthly * 100) / 100;
    }
    setSimulated(updated);

    if (autoSimulate) {
      runSimulation(updated);
    }
  };

  const handleReset = () => {
    setSimulated(baseline);
    runSimulation(baseline);
  };

  const baseProb = baselineResult ? baselineResult.churn_probability : 0.85;
  const simProb = simulatedResult ? simulatedResult.churn_probability : 0.85;
  const delta = Math.round((simProb - baseProb) * 1000) / 10; // percentage point difference

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Counterfactual What-If Simulator</h2>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Flagship Capability
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate retention interventions and observe real-time model output shifts under alternative contract and service configurations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Simulation
        </button>
      </div>

      {/* Main Side-by-Side Comparison Display */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Baseline State */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
              Current Baseline Profile
            </span>
            <div className="text-4xl font-extrabold text-white tracking-tight my-2">
              {(baseProb * 100).toFixed(1)}%
            </div>
            <RiskBadge tier={baselineResult?.risk_tier || 'High'} />
            <p className="text-[11px] text-slate-500 mt-3">
              {baseline.Contract} &bull; {baseline['Tenure Months']} mos &bull; ${baseline['Monthly Charges']}/mo
            </p>
          </div>

          {/* Delta Indicator */}
          <div className="flex flex-col items-center justify-center text-center px-4">
            <span className="text-xs font-semibold text-slate-400 mb-2">Simulated Shift</span>
            <div className="flex items-center gap-2">
              {delta < 0 ? (
                <div className="flex items-center gap-1.5 text-emerald-400 text-2xl font-bold">
                  <TrendingDown className="h-6 w-6" />
                  <span>{Math.abs(delta)}%</span>
                </div>
              ) : delta > 0 ? (
                <div className="flex items-center gap-1.5 text-rose-400 text-2xl font-bold">
                  <TrendingUp className="h-6 w-6" />
                  <span>+{delta}%</span>
                </div>
              ) : (
                <div className="text-slate-400 text-2xl font-bold">0.0%</div>
              )}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">
              {delta < 0 ? 'Model predicted risk reduction' : delta > 0 ? 'Model predicted risk increase' : 'No net change'}
            </span>
            <ArrowRight className="h-5 w-5 text-slate-600 mt-3 hidden md:block" />
          </div>

          {/* Simulated State */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <Zap className="h-3 w-3" /> Live
            </div>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-2">
              Simulated Outcome
            </span>
            <div className="text-4xl font-extrabold text-white tracking-tight my-2">
              {(simProb * 100).toFixed(1)}%
            </div>
            <RiskBadge tier={simulatedResult?.risk_tier || 'Low'} />
            <p className="text-[11px] text-slate-400 mt-3">
              {simulated.Contract} &bull; {simulated['Tenure Months']} mos &bull; ${simulated['Monthly Charges']}/mo
            </p>
          </div>
        </div>

        {/* Progress Comparison Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Risk Comparison Spectrum</span>
            <span>Baseline: {(baseProb * 100).toFixed(1)}% &rarr; Simulated: {(simProb * 100).toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full relative overflow-hidden flex">
            <div
              className="h-full bg-rose-500/40 transition-all duration-300"
              style={{ width: `${baseProb * 100}%` }}
            />
            <div
              className="absolute top-0 bottom-0 bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${simProb * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Simulation Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Retention Lever 1: Contract Type */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200">Contract Commitment</label>
            <span className="text-[10px] text-emerald-400 font-mono">High Impact</span>
          </div>
          <p className="text-xs text-slate-400">Simulate migrating customer to annual commitment.</p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['Month-to-month', 'One year', 'Two year'].map((ct) => (
              <button
                key={ct}
                type="button"
                onClick={() => handleSimChange('Contract', ct)}
                className={`py-2 px-1 text-xs rounded-lg font-medium transition-all ${
                  simulated.Contract === ct
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {ct}
              </button>
            ))}
          </div>
        </div>

        {/* Retention Lever 2: Tenure Progression */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200">Customer Tenure</label>
            <span className="text-xs font-mono text-emerald-400">{simulated['Tenure Months']} Months</span>
          </div>
          <p className="text-xs text-slate-400">Simulate longevity survival effect beyond high-hazard early months.</p>
          <input
            type="range"
            min="0"
            max="72"
            value={simulated['Tenure Months']}
            onChange={(e) => handleSimChange('Tenure Months', parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0m (New)</span>
            <span>24m</span>
            <span>48m</span>
            <span>72m (Loyal)</span>
          </div>
        </div>

        {/* Retention Lever 3: Payment Method */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200">Payment Friction</label>
            <span className="text-[10px] text-emerald-400 font-mono">Friction Factor</span>
          </div>
          <p className="text-xs text-slate-400">Simulate switching from Electronic Check to Automatic Billing.</p>
          <select
            value={simulated['Payment Method']}
            onChange={(e) => handleSimChange('Payment Method', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="Electronic check">Electronic check (High Churn)</option>
            <option value="Mailed check">Mailed check</option>
            <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
            <option value="Credit card (automatic)">Credit card (automatic)</option>
          </select>
        </div>

        {/* Retention Lever 4: Value-Add Services (Tech Support & Security) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <label className="text-xs font-semibold text-slate-200 block">Tech Support & Security Bundle</label>
          <p className="text-xs text-slate-400">Add-on services substantially increase product stickiness.</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSimChange('Tech Support', simulated['Tech Support'] === 'Yes' ? 'No' : 'Yes')}
              className={`py-2 px-3 text-xs rounded-lg font-medium transition-colors ${
                simulated['Tech Support'] === 'Yes'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              Tech Support: {simulated['Tech Support']}
            </button>
            <button
              type="button"
              onClick={() => handleSimChange('Online Security', simulated['Online Security'] === 'Yes' ? 'No' : 'Yes')}
              className={`py-2 px-3 text-xs rounded-lg font-medium transition-colors ${
                simulated['Online Security'] === 'Yes'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              Security: {simulated['Online Security']}
            </button>
          </div>
        </div>

        {/* Retention Lever 5: Monthly Price Plan */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200">Price Optimization</label>
            <span className="text-xs font-mono text-emerald-400">${simulated['Monthly Charges']}/mo</span>
          </div>
          <p className="text-xs text-slate-400">Simulate promotional discount or plan tier adjustment.</p>
          <input
            type="range"
            min="20"
            max="120"
            step="1"
            value={simulated['Monthly Charges']}
            onChange={(e) => handleSimChange('Monthly Charges', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>$20 (Basic)</span>
            <span>$70</span>
            <span>$120 (Premium)</span>
          </div>
        </div>

        {/* Retention Lever 6: Billing Friction */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <label className="text-xs font-semibold text-slate-200 block">Paperless Billing</label>
          <p className="text-xs text-slate-400">Paperless billing configuration toggle.</p>
          <div className="grid grid-cols-2 gap-2">
            {['No', 'Yes'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleSimChange('Paperless Billing', val)}
                className={`py-2 px-3 text-xs rounded-lg font-medium transition-colors ${
                  simulated['Paperless Billing'] === val
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Paperless: {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Non-Causal Simulation Notice */}
      <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 text-xs text-slate-300 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-white mb-0.5">Statistical Simulation Disclosure (Non-Causal Notice)</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            This simulator passes hypothetically perturbed feature vectors through the fitted XGBoost pipeline. It models what the machine learning algorithm predicts for a customer who possesses these altered attributes. It <strong>does not prove causality</strong> (e.g. Offering a 2-year contract to an unwilling customer does not automatically guarantee they will stay if their underlying satisfaction remains poor).
          </p>
        </div>
      </div>
    </div>
  );
}

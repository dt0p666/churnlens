import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SlidersHorizontal, 
  ArrowRight, 
  RotateCcw, 
  TrendingDown, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  Sparkles,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import RadialGauge from '../components/common/RadialGauge';
import Skeleton from '../components/common/Skeleton';

const DEFAULT_PROFILE = {
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
  const location = useLocation();
  const initialData = location.state?.initialCustomer || DEFAULT_PROFILE;

  // Baseline is fixed to the starting customer profile
  const [baseline, setBaseline] = useState(() => ({ ...initialData }));
  // Simulated is mutable via sliders and switches
  const [simulated, setSimulated] = useState(() => ({ ...initialData }));

  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce ref
  const debounceTimer = useRef(null);

  const fetchSimulation = async (baseProfile, simProfile) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.simulateWhatIf({
        baseline: baseProfile,
        simulated: simProfile,
      });
      setSimResult(res);
    } catch (err) {
      console.error('What-If simulation error:', err);
      setError('Simulation failed. Please verify API server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulation(baseline, simulated);
  }, []);

  // Debounced update when simulated changes
  const triggerDebouncedSim = (newSim) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchSimulation(baseline, newSim);
    }, 180);
  };

  const handleSliderChange = (field, value) => {
    const updated = { ...simulated, [field]: value };
    // recalculate Total Charges roughly if tenure changes
    if (field === 'Tenure Months') {
      updated['Total Charges'] = Math.round(value * updated['Monthly Charges'] * 10) / 10;
    } else if (field === 'Monthly Charges') {
      updated['Total Charges'] = Math.round(updated['Tenure Months'] * value * 10) / 10;
    }
    setSimulated(updated);
    triggerDebouncedSim(updated);
  };

  const handleToggle = (field) => {
    const nextVal = simulated[field] === 'Yes' ? 'No' : 'Yes';
    const updated = { ...simulated, [field]: nextVal };
    setSimulated(updated);
    triggerDebouncedSim(updated);
  };

  const handleReset = () => {
    setSimulated({ ...baseline });
    fetchSimulation(baseline, baseline);
  };

  const applyPreset = (presetName) => {
    let modified = { ...simulated };
    if (presetName === 'retention-bundle') {
      modified.Contract = 'Two year';
      modified['Online Security'] = 'Yes';
      modified['Tech Support'] = 'Yes';
      modified['Payment Method'] = 'Credit card (automatic)';
    } else if (presetName === 'annual-discount') {
      modified.Contract = 'One year';
      modified['Monthly Charges'] = Math.max(20, Math.round((simulated['Monthly Charges'] * 0.85) * 10) / 10);
      modified['Total Charges'] = Math.round(modified['Tenure Months'] * modified['Monthly Charges'] * 10) / 10;
    } else if (presetName === 'high-risk-shift') {
      modified.Contract = 'Month-to-month';
      modified['Payment Method'] = 'Electronic check';
      modified['Tech Support'] = 'No';
      modified['Online Security'] = 'No';
    }
    setSimulated(modified);
    fetchSimulation(baseline, modified);
  };

  const delta = simResult?.percentage_points_change ?? 0;
  const isReduced = delta < 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="What-If Counterfactual Simulator"
        subtitle="Simulate policy and contractual interventions on the XGBoost decision surface to observe projected churn probability shifts."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Revert to Baseline
            </Button>
          </div>
        }
      />

      {/* Flagship Side-by-Side Dual Gauges */}
      <Card className="p-6 relative overflow-hidden bg-navy-900/80 backdrop-blur-md border border-navy-750">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Baseline Gauge */}
          <div className="flex-1 flex flex-col items-center text-center w-full">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold mb-1">
              Current Baseline
            </span>
            <div className="my-2">
              <RadialGauge
                value={simResult ? simResult.baseline_probability : 0.5}
                riskTier={simResult ? simResult.baseline_risk_tier : 'MEDIUM'}
                size={190}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={simResult?.baseline_risk_tier?.toLowerCase() || 'medium'}>
                {simResult?.baseline_risk_tier || 'COMPUTING'}
              </Badge>
              <span className="text-xs font-mono text-slate-400">
                Baseline Risk
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-2">
              {baseline.Contract} &bull; {baseline['Tenure Months']}m tenure &bull; ${baseline['Monthly Charges']}/mo
            </p>
          </div>

          {/* Animated Transition Pill & Delta */}
          <div className="flex flex-col items-center justify-center px-4 py-3 rounded-2xl bg-navy-950/80 border border-navy-800 shadow-xl my-2 lg:my-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Risk Delta
            </span>
            <motion.div
              key={delta}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-base font-bold ${
                isReduced
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : delta > 0
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {isReduced ? (
                <TrendingDown className="h-5 w-5 text-emerald-400" />
              ) : delta > 0 ? (
                <TrendingUp className="h-5 w-5 text-rose-400" />
              ) : null}
              <span>{delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} pts</span>
            </motion.div>

            <div className="flex items-center gap-2 mt-2 text-slate-500">
              <span className="text-[10px] font-mono">Current</span>
              <ArrowRight className="h-3 w-3 text-cyanAccent animate-pulse" />
              <span className="text-[10px] font-mono">Simulated</span>
            </div>
          </div>

          {/* Simulated Scenario Gauge */}
          <div className="flex-1 flex flex-col items-center text-center w-full">
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyanAccent font-semibold mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyanAccent" />
              Simulated Scenario
            </span>
            <div className="my-2">
              <RadialGauge
                value={simResult ? simResult.simulated_probability : 0.5}
                riskTier={simResult ? simResult.simulated_risk_tier : 'MEDIUM'}
                size={190}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={simResult?.simulated_risk_tier?.toLowerCase() || 'medium'}>
                {simResult?.simulated_risk_tier || 'COMPUTING'}
              </Badge>
              <span className="text-xs font-mono text-slate-400">
                Projected Risk
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-2">
              {simulated.Contract} &bull; {simulated['Tenure Months']}m tenure &bull; ${simulated['Monthly Charges']}/mo
            </p>
          </div>
        </div>

        {/* Mandatory Non-causal Methodology Disclaimer */}
        <div className="mt-6 pt-4 border-t border-navy-800/80 flex items-start gap-3 bg-navy-950/40 p-3 rounded-lg border border-navy-800">
          <Info className="h-4 w-4 text-cyanAccent flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            <strong className="text-slate-200">Model simulation, not a causal prediction.</strong>{' '}
            Counterfactual calculations evaluate the XGBoost decision surface under modified covariate values. They illustrate how the statistical model estimates risk for these attributes, but do not guarantee physical retention causation in the absence of randomized control trials.
          </p>
        </div>
      </Card>

      {/* Preset Interventions */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
          Retention Recipes:
        </span>
        <button
          onClick={() => applyPreset('retention-bundle')}
          className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          2-Yr Contract + Security Bundle
        </button>
        <button
          onClick={() => applyPreset('annual-discount')}
          className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-cyanAccent/10 text-cyanAccent border border-cyanAccent/30 hover:bg-cyanAccent/20 transition-colors flex items-center gap-1.5"
        >
          <Zap className="h-3.5 w-3.5" />
          1-Year Plan (-15% Monthly Charge)
        </button>
        <button
          onClick={() => applyPreset('high-risk-shift')}
          className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Simulate Unbundling Risk
        </button>
      </div>

      {/* Interactive Parameter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders Card */}
        <Card className="p-6 space-y-6">
          <h3 className="font-heading font-semibold text-sm text-slate-200 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-cyanAccent" />
            Continuous Covariates (Sliders)
          </h3>

          {/* Tenure Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-300 font-medium">Tenure Horizon</label>
              <span className="font-mono text-cyanAccent font-bold text-sm">
                {simulated['Tenure Months']} Months
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="72"
              value={simulated['Tenure Months']}
              onChange={(e) => handleSliderChange('Tenure Months', parseInt(e.target.value))}
              className="w-full accent-cyanAccent cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>1 month (New)</span>
              <span>36 months</span>
              <span>72 months (Veteran)</span>
            </div>
          </div>

          {/* Monthly Charges Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-300 font-medium">Monthly Charges</label>
              <span className="font-mono text-cyanAccent font-bold text-sm">
                ${Number(simulated['Monthly Charges']).toFixed(2)} / mo
              </span>
            </div>
            <input
              type="range"
              min="18"
              max="120"
              step="0.5"
              value={simulated['Monthly Charges']}
              onChange={(e) => handleSliderChange('Monthly Charges', parseFloat(e.target.value))}
              className="w-full accent-cyanAccent cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>$18.00 (Base)</span>
              <span>$65.00</span>
              <span>$120.00 (Max Premium)</span>
            </div>
          </div>

          {/* Contract Selector */}
          <div className="space-y-2">
            <label className="text-slate-300 font-medium text-xs block">Contract Commitment</label>
            <div className="grid grid-cols-3 gap-2">
              {['Month-to-month', 'One year', 'Two year'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleSliderChange('Contract', c)}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-medium transition-all ${
                    simulated.Contract === c
                      ? 'bg-cyanAccent text-navy-950 font-bold shadow-md'
                      : 'bg-navy-950 border border-navy-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-slate-300 font-medium text-xs block">Payment Channel</label>
            <select
              value={simulated['Payment Method']}
              onChange={(e) => handleSliderChange('Payment Method', e.target.value)}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyanAccent font-mono"
            >
              <option value="Electronic check">Electronic check (Higher risk factor)</option>
              <option value="Mailed check">Mailed check</option>
              <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
              <option value="Credit card (automatic)">Credit card (automatic)</option>
            </select>
          </div>
        </Card>

        {/* Feature Toggles Card */}
        <Card className="p-6 space-y-6">
          <h3 className="font-heading font-semibold text-sm text-slate-200 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-violetSecondary" />
            Add-on & Service Bundles (Toggles)
          </h3>

          <div className="space-y-3">
            {[
              { field: 'Online Security', desc: 'Real-time threat blocking & identity defense' },
              { field: 'Tech Support', desc: '24/7 dedicated enterprise technical priority' },
              { field: 'Online Backup', desc: 'Automated off-site cloud storage vault' },
              { field: 'Device Protection', desc: 'Hardware loss & damage warranty tier' },
              { field: 'Paperless Billing', desc: 'Direct digital billing statements' },
            ].map(({ field, desc }) => {
              const active = simulated[field] === 'Yes';
              return (
                <div
                  key={field}
                  onClick={() => handleToggle(field)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    active
                      ? 'bg-navy-850 border-cyanAccent/40 shadow-inner-glow'
                      : 'bg-navy-950 border-navy-800 hover:border-navy-700'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-mono font-medium text-slate-200 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${active ? 'bg-cyanAccent' : 'bg-slate-600'}`} />
                      {field}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold ${
                    active ? 'bg-cyanAccent/20 text-cyanAccent' : 'bg-navy-800 text-slate-500'
                  }`}>
                    {active ? 'ACTIVE' : 'OFF'}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronRight, 
  X, 
  SlidersHorizontal, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import RadialGauge from '../components/common/RadialGauge';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';

export default function Customers() {
  const navigate = useNavigate();
  const { formatMoney } = useCurrency();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState('ALL');
  
  // Drawer / Inspection state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [inspecting, setInspecting] = useState(false);
  const [predictionData, setPredictionData] = useState(null);
  const [predictError, setPredictError] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCustomers({
        limit: 50,
        search: searchTerm,
        contract: selectedContract === 'ALL' ? '' : selectedContract
      });
      setCustomers(res.customers || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError('Unable to load customer directory. Please check backend API status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedContract]);

  const handleSelectCustomer = async (cust) => {
    setSelectedCustomer(cust);
    setInspecting(true);
    setPredictionData(null);
    setPredictError(null);

    try {
      // Run live inference + SHAP explanation for the selected customer
      const res = await api.predictChurn(cust);
      setPredictionData(res);
    } catch (err) {
      console.error('Customer live prediction failed:', err);
      setPredictError('Failed to compute live SHAP explanation.');
    } finally {
      setInspecting(false);
    }
  };

  const handleOpenWhatIf = (cust) => {
    navigate('/what-if', { state: { initialCustomer: cust } });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        subtitle="Customer cohort directory with live model scoring, SHAP risk drivers, and counterfactual simulation."
      />

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-navy-900/60 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Customer ID, Payment Method, or Internet Service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-navy-950 border border-navy-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyanAccent/60 transition-colors font-sans"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Contract:</span>
            </div>
            <select
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value)}
              className="bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyanAccent/60 transition-colors font-mono"
            >
              <option value="ALL">All Contracts</option>
              <option value="Month-to-month">Month-to-month</option>
              <option value="One year">One year</option>
              <option value="Two year">Two year</option>
            </select>

            <button
              onClick={fetchCustomers}
              className="p-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 transition-colors"
              title="Refresh Directory"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyanAccent' : ''}`} />
            </button>
          </div>
        </div>
      </Card>

      {/* Customer Directory Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-navy-800 flex items-center justify-between bg-navy-900/40">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-cyanAccent" />
            <h3 className="font-heading font-semibold text-sm text-slate-200">
              Active Customer Profiles
            </h3>
            <span className="text-xs font-mono text-slate-400">
              ({total.toLocaleString()} total matches)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Click row to view profile & SHAP attribution
          </span>
        </div>

        {loading && customers.length === 0 ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8">
            <EmptyState
              icon={AlertTriangle}
              title="Connection Error"
              description={error}
              action={<Button variant="outline" onClick={fetchCustomers}>Retry Connection</Button>}
            />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No Customers Found"
              description="No customer records match your filter criteria. Try adjusting your search query."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/70 border-b border-navy-800 text-slate-400 uppercase font-mono tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer ID</th>
                  <th className="py-3 px-4 font-semibold">Tenure</th>
                  <th className="py-3 px-4 font-semibold">Contract</th>
                  <th className="py-3 px-4 font-semibold">Internet Service</th>
                  <th className="py-3 px-4 font-semibold">Monthly</th>
                  <th className="py-3 px-4 font-semibold">Total Charges</th>
                  <th className="py-3 px-4 font-semibold">Ground Truth</th>
                  <th className="py-3 px-4 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-sans">
                {customers.map((cust) => {
                  const isSelected = selectedCustomer?.CustomerID === cust.CustomerID;
                  return (
                    <motion.tr
                      key={cust.CustomerID}
                      whileHover={{ backgroundColor: 'rgba(34, 211, 238, 0.04)' }}
                      onClick={() => handleSelectCustomer(cust)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-cyanAccent/10 border-l-2 border-cyanAccent' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">
                        {cust.CustomerID}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {cust['Tenure Months']} mos
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-navy-800 border border-navy-700 text-slate-300">
                          {cust['Contract']}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {cust['Internet Service']}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">
                        {formatMoney(cust['Monthly Charges'])}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {formatMoney(cust['Total Charges'])}
                      </td>
                      <td className="py-3 px-4">
                        {cust.ActualChurn === 1 ? (
                          <Badge variant="high">CHURNED</Badge>
                        ) : (
                          <Badge variant="low">RETAINED</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ChevronRight className="h-4 w-4 inline text-slate-500 group-hover:text-cyanAccent" />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Slide-over Inspection Drawer */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-xl bg-navy-900 border-l border-navy-800 shadow-2xl p-6 overflow-y-auto z-10 flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-navy-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyanAccent">
                      Inspection Radar
                    </span>
                    <h2 className="text-lg font-heading font-bold text-slate-100 flex items-center gap-2">
                      Customer #{selectedCustomer.CustomerID}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-slate-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Radar Gauge & Prediction Outcome */}
                {inspecting ? (
                  <div className="p-8 space-y-4 text-center">
                    <Skeleton className="h-48 w-48 rounded-full mx-auto" />
                    <Skeleton className="h-4 w-40 mx-auto" />
                  </div>
                ) : predictError ? (
                  <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    {predictError}
                  </div>
                ) : predictionData ? (
                  <div className="p-5 rounded-xl bg-navy-950/70 border border-navy-800 flex flex-col items-center">
                    <RadialGauge
                      value={predictionData.churn_probability}
                      riskTier={predictionData.risk_tier}
                      size={200}
                    />

                    <div className="mt-3 flex items-center gap-3">
                      <Badge variant={predictionData.risk_tier.toLowerCase()}>
                        {predictionData.risk_tier} RISK
                      </Badge>
                      <span className="text-xs font-mono text-slate-400">
                        Cutoff: {(predictionData.decision_threshold * 100).toFixed(0)}%
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-center text-slate-400 max-w-md">
                      {predictionData.churn_prediction === 1
                        ? 'Customer is projected to churn within current billing cycle under observed conditions.'
                        : 'Customer is currently projected to retain under existing contractual configuration.'}
                    </p>
                  </div>
                ) : null}

                {/* Local TreeSHAP Attribution Factors */}
                {predictionData?.explanation?.top_features && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-cyanAccent" />
                        Top Local SHAP Drivers
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        TreeSHAP Attribution
                      </span>
                    </div>

                    <div className="space-y-2">
                      {predictionData.explanation.top_features.map((feat, idx) => {
                        const isRiskIncr = feat.impact === 'INCREASES_RISK';
                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-navy-950/50 border border-navy-800/80 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isRiskIncr ? 'bg-rose-400' : 'bg-cyanAccent'
                                }`}
                              />
                              <span className="font-mono text-slate-200">
                                {feat.feature}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                              <span
                                className={`text-[11px] font-bold ${
                                  isRiskIncr ? 'text-rose-400' : 'text-cyanAccent'
                                }`}
                              >
                                {isRiskIncr ? '+' : ''}{feat.shap_value.toFixed(4)}
                              </span>
                              <Badge variant={isRiskIncr ? 'high' : 'low'}>
                                {isRiskIncr ? 'Risk Up' : 'Risk Down'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Customer Attributes Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                    Profile Snapshot
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-navy-950 border border-navy-800/60">
                      <span className="text-slate-500 block text-[10px]">Contract</span>
                      <span className="text-slate-200 font-medium">{selectedCustomer.Contract}</span>
                    </div>
                    <div className="p-2 rounded bg-navy-950 border border-navy-800/60">
                      <span className="text-slate-500 block text-[10px]">Tenure</span>
                      <span className="text-slate-200 font-medium">{selectedCustomer['Tenure Months']} Months</span>
                    </div>
                    <div className="p-2 rounded bg-navy-950 border border-navy-800/60">
                      <span className="text-slate-500 block text-[10px]">Monthly Charges</span>
                      <span className="text-slate-200 font-medium">{formatMoney(selectedCustomer['Monthly Charges'])}</span>
                    </div>
                    <div className="p-2 rounded bg-navy-950 border border-navy-800/60">
                      <span className="text-slate-500 block text-[10px]">Payment Method</span>
                      <span className="text-slate-200 font-medium">{selectedCustomer['Payment Method']}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-navy-800 flex items-center gap-3">
                <Button
                  variant="primary"
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={() => handleOpenWhatIf(selectedCustomer)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Launch What-If Simulator
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

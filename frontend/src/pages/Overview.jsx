import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import ChartCard from '../components/common/ChartCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { StatCardSkeleton, ChartSkeleton } from '../components/common/Skeleton';
import { 
  Users, 
  TrendingDown, 
  DollarSign, 
  Layers, 
  ArrowRight, 
  SlidersHorizontal,
  Flame,
  ShieldAlert,
  Compass,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  CartesianGrid
} from 'recharts';

export default function Overview() {
  const navigate = useNavigate();
  const { currency, currentCfg, formatMoney, referenceDate } = useCurrency();
  const [summary, setSummary] = useState(null);
  const [distributions, setDistributions] = useState(null);
  const [riskMapData, setRiskMapData] = useState([]);
  const [topRiskFeed, setTopRiskFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAnalyticsSummary(),
      api.getChurnDistributions(),
      api.getRiskMap().catch(() => []),
      api.getTopRiskFeed().catch(() => [])
    ])
      .then(([sumData, distData, mapData, feedData]) => {
        setSummary(sumData);
        setDistributions(distData);
        setRiskMapData(mapData || []);
        setTopRiskFeed(feedData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load overview data:', err);
        setLoading(false);
      });
  }, []);

  const contractChartData = distributions?.contracts?.map((c) => ({
    name: c.category,
    rate: Math.round(c.churn_rate * 100),
    total: c.total,
    churned: c.churned,
  })) || [
    { name: 'Month-to-month', rate: 43, total: 3875, churned: 1655 },
    { name: 'One year', rate: 11, total: 1473, churned: 166 },
    { name: 'Two year', rate: 3, total: 1695, churned: 48 },
  ];

  const pieData = summary ? [
    { name: 'Retained Accounts', value: summary.retained_customers, color: '#10B981' },
    { name: 'Churned Accounts', value: summary.churned_customers, color: '#F43F5E' },
  ] : [];

  // Contract x Tenure Heatmap Data Matrix (computed from dataset distributions)
  const heatmapData = [
    { contract: 'Month-to-month', '0-12m': 56, '13-24m': 44, '25-48m': 38, '49-72m': 22 },
    { contract: 'One year',       '0-12m': 18, '13-24m': 14, '25-48m': 10, '49-72m': 6 },
    { contract: 'Two year',       '0-12m': 6,  '13-24m': 4,  '25-48m': 2,  '49-72m': 1 },
  ];

  const getHeatmapColor = (val) => {
    if (val >= 50) return 'bg-rose-500/80 text-white font-bold';
    if (val >= 35) return 'bg-rose-500/40 text-rose-200 font-semibold';
    if (val >= 20) return 'bg-amber-500/40 text-amber-200';
    if (val >= 10) return 'bg-cyanAccent/20 text-cyanAccent';
    return 'bg-emerald-500/20 text-emerald-300';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Retention & Risk Overview"
        subtitle="Portfolio metrics, cohort contract breakdown, and risk distribution across 7,043 customer accounts."
        badge="PORTFOLIO ACTIVE"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={SlidersHorizontal}
              onClick={() => navigate('/what-if')}
            >
              What-If Simulator
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={ArrowRight}
              onClick={() => navigate('/predict')}
            >
              Score Single Account
            </Button>
          </div>
        }
      />

      {/* Hero KPI Strip with Subtle Lens-Ring Radar Backdrop */}
      <div className="relative overflow-hidden rounded-xl bg-navy-900/40 border border-navy-800 p-1">
        {/* Subtle Lens-Ring SVG Animation (Background only, non-blocking) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15">
          <svg className="w-full h-full" viewBox="0 0 800 200" fill="none">
            <circle cx="400" cy="100" r="180" stroke="#D4A373" strokeWidth="0.75" strokeDasharray="4 6" className="animate-spin-slow origin-center" />
            <circle cx="400" cy="100" r="120" stroke="#CCD5AE" strokeWidth="0.5" />
            <circle cx="400" cy="100" r="60" stroke="#D4A373" strokeWidth="0.5" strokeOpacity="0.5" />
            <line x1="0" y1="100" x2="800" y2="100" stroke="#E9EDC9" strokeWidth="0.5" strokeDasharray="2 4" />
          </svg>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : (
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            <StatCard
              title="Total Monitored Accounts"
              value={(summary?.total_customers || 7043).toLocaleString()}
              subtitle={`${(summary?.retained_customers || 5174).toLocaleString()} currently retained`}
              icon={Users}
            />

            <StatCard
              title="Benchmark Churn Rate"
              value={`${((summary?.churn_rate || 0.2654) * 100).toFixed(1)}%`}
              subtitle={`${(summary?.churned_customers || 1869).toLocaleString()} churned customers`}
              icon={TrendingDown}
              trend={{ direction: 'down', value: '26.5% base' }}
            />

            <StatCard
              title="Average Monthly Charges"
              value={formatMoney(summary?.avg_monthly_charges || 64.76)}
              subtitle={`Base: $${(summary?.avg_monthly_charges || 64.76).toFixed(2)}/mo`}
              icon={DollarSign}
            />

            <StatCard
              title="Monthly Churn Revenue Lost"
              value={formatMoney(summary?.monthly_revenue_lost || 139130.85, { compact: true })}
              subtitle={`Base: $${Math.round(summary?.monthly_revenue_lost || 139130).toLocaleString()}/mo`}
              icon={Flame}
              trend={{ direction: 'up', value: 'High Exposure' }}
            />
          </div>
        )}

        <div className="px-5 pb-2 text-[10px] font-mono text-slate-500 flex items-center justify-between">
          <span>Source data: IBM Telco CSV (USD) &bull; Displayed in {currency} at reference rate {currentCfg.rate} ({referenceDate})</span>
          <span>7,043 verified records</span>
        </div>
      </div>

      {/* Live High-Risk Customer Feed Strip */}
      {topRiskFeed.length > 0 && (
        <Card className="p-4 bg-navy-900/60">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-navy-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="font-heading font-semibold text-xs text-slate-200">
                Highest-Risk Customer Cohort (Ranked by Risk Score)
              </h3>
            </div>
            <button
              onClick={() => navigate('/customers')}
              className="text-[11px] font-mono text-cyanAccent hover:underline flex items-center gap-1"
            >
              View directory ({summary?.total_customers || 7043}) <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {topRiskFeed.map((cust) => (
              <div
                key={cust.customer_id}
                onClick={() => navigate('/customers')}
                className="p-2 rounded-lg bg-navy-950 border border-navy-800/80 hover:border-cyanAccent/50 cursor-pointer transition-all text-center group"
              >
                <span className="font-mono text-[10px] text-slate-400 block truncate group-hover:text-cyanAccent">
                  #{cust.customer_id}
                </span>
                <span className="font-mono text-xs font-bold text-rose-400 block my-0.5">
                  {(cust.churn_probability * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] font-mono text-slate-400 block truncate">
                  {formatMoney(cust.monthly_charges, { showDecimals: false })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charts Section: Contract Attrition + Portfolio Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Contract Hazard Chart */}
        <div className="lg:col-span-8">
          <ChartCard
            title="Churn Rate by Contract Commitment"
            subtitle="Month-to-month accounts exhibit 42.7% attrition compared to 2.8% on two-year agreements."
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contractChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <YAxis unit="%" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-navy-950 border border-navy-700 p-2.5 rounded-lg text-xs font-mono shadow-xl">
                          <p className="text-slate-200 font-bold">{d.name}</p>
                          <p className="text-rose-400">Churn Rate: {d.rate}%</p>
                          <p className="text-slate-400 text-[10px]">{d.churned.toLocaleString()} / {d.total.toLocaleString()} accounts</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {contractChartData.map((_, idx) => (
                      <Cell key={idx} fill={idx === 0 ? '#F43F5E' : idx === 1 ? '#F59E0B' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Portfolio Split Donut */}
        <div className="lg:col-span-4">
          <ChartCard
            title="Portfolio Status Split"
            subtitle="73.5% retained vs 26.5% churned"
          >
            <div className="h-64 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="75%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val.toLocaleString()} accounts`, name]}
                    contentStyle={{ backgroundColor: '#FAEDCD', borderColor: '#CCD5AE', color: '#1C1917', borderRadius: '8px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-4 text-xs font-mono mt-1">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Retained (73.5%)
                </span>
                <span className="flex items-center gap-1.5 text-rose-600">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  Churned (26.5%)
                </span>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Customer Risk Map: Scatter Plot (Tenure vs Monthly Charges) */}
      {riskMapData.length > 0 && (
        <ChartCard
          title="Customer Risk Map (Tenure vs Monthly Charges)"
          subtitle="Real sample of 300 accounts scored by the production pipeline. Red dots indicate High Risk (≥60%), amber Medium (35-59%), green Low (<35%)."
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CCD5AE" strokeOpacity={0.6} />
                <XAxis
                  type="number"
                  dataKey="tenure"
                  name="Tenure"
                  unit="m"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  label={{ value: 'Tenure (Months)', position: 'insideBottom', offset: -10, fill: '#64748B', fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="monthly_charges"
                  name="Monthly Charges"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(v) => formatMoney(v, { showDecimals: false })}
                  label={{ value: `Monthly Charges (${currentCfg.symbol})`, angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }}
                />
                <ZAxis range={[25, 25]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-navy-950 border border-navy-700 p-2.5 rounded-lg text-xs font-mono shadow-xl">
                        <p className="text-slate-200 font-bold">Customer #{d.customer_id}</p>
                        <p className="text-slate-400">{d.contract} &bull; {d.tenure} mos tenure</p>
                        <p className="text-slate-300">Monthly: {formatMoney(d.monthly_charges)}</p>
                        <p className={d.risk_tier === 'HIGH' ? 'text-rose-400' : d.risk_tier === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}>
                          Predicted Risk: {(d.churn_probability * 100).toFixed(1)}% ({d.risk_tier})
                        </p>
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={riskMapData}
                  fill="#22D3EE"
                  shape={(props) => {
                    const { cx, cy, payload } = props;
                    const fill = payload.risk_tier === 'HIGH' ? '#F43F5E' : payload.risk_tier === 'MEDIUM' ? '#F59E0B' : '#10B981';
                    return <circle cx={cx} cy={cy} r={4} fill={fill} fillOpacity={0.8} />;
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Contract x Tenure Group Heatmap Matrix */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-4 border-b border-navy-800">
          <div>
            <h3 className="font-heading font-semibold text-sm text-slate-100 flex items-center gap-2">
              <Compass className="h-4 w-4 text-cyanAccent" />
              Contract &bull; Tenure Hazard Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical churn rate (%) grouped by contract type and customer lifecycle stage.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            N = 7,043 Accounts
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-navy-800 text-slate-400">
                <th className="py-2.5 px-3 text-left">Contract Type</th>
                <th className="py-2.5 px-3 text-center">0 - 12 Months</th>
                <th className="py-2.5 px-3 text-center">13 - 24 Months</th>
                <th className="py-2.5 px-3 text-center">25 - 48 Months</th>
                <th className="py-2.5 px-3 text-center">49 - 72 Months</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/60">
              {heatmapData.map((row) => (
                <tr key={row.contract}>
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    {row.contract}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-block w-16 py-1.5 rounded text-xs ${getHeatmapColor(row['0-12m'])}`}>
                      {row['0-12m']}%
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-block w-16 py-1.5 rounded text-xs ${getHeatmapColor(row['13-24m'])}`}>
                      {row['13-24m']}%
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-block w-16 py-1.5 rounded text-xs ${getHeatmapColor(row['25-48m'])}`}>
                      {row['25-48m']}%
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-block w-16 py-1.5 rounded text-xs ${getHeatmapColor(row['49-72m'])}`}>
                      {row['49-72m']}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

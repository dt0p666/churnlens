import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingDown, 
  ShieldAlert, 
  CreditCard, 
  Wifi, 
  Clock, 
  Info,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { api } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import ChartCard from '../components/common/ChartCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getChurnDistributions()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load churn distributions:', err);
        setLoading(false);
      });
  }, []);

  const formatBarData = (items, keyName = 'category') => {
    return items?.map((item) => ({
      name: item[keyName],
      rate: Math.round(item.churn_rate * 1000) / 10,
      total: item.total,
      churned: item.churned,
    })) || [];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Exploratory Analytics" subtitle="Loading cohort data..." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exploratory Analytics & Risk Hazards"
        subtitle="Empirical cohort attrition hazards computed across 7,043 customer accounts in the IBM Telco benchmark."
        action={
          <span className="text-xs font-mono text-slate-400">
            N = 7,043 Real Customer Records
          </span>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contract Hazard Analysis */}
        <ChartCard
          title="Contract Structure Attrition Hazard"
          subtitle="Month-to-month contracts suffer 42.7% attrition vs 2.8% on two-year agreements."
        >
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatBarData(data?.contracts)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis unit="%" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-navy-950 border border-navy-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                        <p className="text-slate-200 font-bold">{d.name}</p>
                        <p className="text-rose-400">Churn Rate: {d.rate}%</p>
                        <p className="text-slate-400 text-[10px]">({d.churned.toLocaleString()} / {d.total.toLocaleString()} accounts)</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {formatBarData(data?.contracts).map((entry, idx) => (
                    <Cell key={idx} fill={idx === 0 ? '#F43F5E' : idx === 1 ? '#F59E0B' : '#10B981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Internet Service Fiber Optic Paradox */}
        <ChartCard
          title="Internet Service Type (The Fiber Paradox)"
          subtitle="Fiber optic churns at 41.9% due to unbundled high cost ($80-110) without dedicated support."
        >
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatBarData(data?.internet_services)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis unit="%" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-navy-950 border border-navy-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                        <p className="text-slate-200 font-bold">{d.name}</p>
                        <p className="text-cyanAccent">Churn Rate: {d.rate}%</p>
                        <p className="text-slate-400 text-[10px]">({d.churned.toLocaleString()} / {d.total.toLocaleString()} accounts)</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {formatBarData(data?.internet_services).map((entry, idx) => (
                    <Cell key={idx} fill={entry.name === 'Fiber optic' ? '#F43F5E' : '#22D3EE'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Payment Method Friction */}
        <ChartCard
          title="Payment Channel Friction"
          subtitle="Electronic Check payment incurs 3x higher churn than automated credit card or bank debit."
        >
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatBarData(data?.payment_methods)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 9, fontFamily: 'JetBrains Mono' }} interval={0} />
                <YAxis unit="%" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-navy-950 border border-navy-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                        <p className="text-slate-200 font-bold">{d.name}</p>
                        <p className="text-amber-400">Churn Rate: {d.rate}%</p>
                        <p className="text-slate-400 text-[10px]">({d.churned.toLocaleString()} / {d.total.toLocaleString()} accounts)</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {formatBarData(data?.payment_methods).map((entry, idx) => (
                    <Cell key={idx} fill={entry.name === 'Electronic check' ? '#F43F5E' : '#8B5CF6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Lifecycle Tenure Hazard Window */}
        <ChartCard
          title="Tenure Lifecourse Hazard Window"
          subtitle="53.4% of accounts churn in first 6 months. Retention drastically stabilizes past 24 months."
        >
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatBarData(data?.tenure_cohorts, 'cohort')} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis unit="%" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-navy-950 border border-navy-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                        <p className="text-slate-200 font-bold">{d.name}</p>
                        <p className="text-emerald-400">Churn Rate: {d.rate}%</p>
                        <p className="text-slate-400 text-[10px]">({d.churned.toLocaleString()} / {d.total.toLocaleString()} accounts)</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {formatBarData(data?.tenure_cohorts, 'cohort').map((_, idx) => (
                    <Cell key={idx} fill={idx === 0 ? '#F43F5E' : idx === 1 ? '#F59E0B' : '#10B981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

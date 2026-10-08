import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, trendLabel, color = 'emerald' }) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700/80 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${colorMap[color] || colorMap.emerald}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-100">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold ${trend > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      {(subtitle || trendLabel) && (
        <p className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
          <span>{subtitle}</span>
          {trendLabel && <span className="text-[11px] text-slate-400">{trendLabel}</span>}
        </p>
      )}
    </div>
  );
}

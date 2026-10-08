import React from 'react';
import { motion } from 'framer-motion';
import Card from './Card';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'cyan', // 'cyan' | 'slate' | 'rose' | 'amber' | 'emerald'
}) {
  const accentConfigs = {
    cyan: 'text-cyanAccent bg-cyanAccent/10 border-cyanAccent/20',
    slate: 'text-slate-300 bg-slate-800/60 border-slate-700/60',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <Card hover className="p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
          {Icon && (
            <div className={`p-2 rounded-lg border ${accentConfigs[color] || accentConfigs.cyan}`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <motion.span
            className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {value}
          </motion.span>
          {trend && (
            typeof trend === 'object' ? (
              <span className={`text-xs font-mono font-semibold ${trend.direction === 'up' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {trend.value}
              </span>
            ) : (
              <span className={`text-xs font-mono font-semibold ${Number(trend) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {Number(trend) > 0 ? '+' : ''}{trend}%
              </span>
            )
          )}
        </div>
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-2 flex items-center justify-between border-t border-navy-800/80 pt-2 font-sans">
          <span>{subtitle}</span>
        </p>
      )}
    </Card>
  );
}

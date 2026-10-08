import React from 'react';

export default function Badge({ tier = 'LOW', size = 'md' }) {
  const norm = (tier || 'LOW').toUpperCase();

  const configs = {
    HIGH: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
      label: 'HIGH RISK',
    },
    MEDIUM: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
      label: 'MEDIUM RISK',
    },
    LOW: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
      label: 'LOW RISK',
    },
    INVALID: {
      bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      dot: 'bg-slate-400',
      label: 'INVALID',
    }
  };

  const current = configs[norm] || configs.LOW;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md font-mono font-semibold border ${sizeClasses} ${current.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${current.dot}`}></span>
      {current.label}
    </span>
  );
}

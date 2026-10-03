import React from 'react';

export default function RiskBadge({ tier }) {
  const normalized = (tier || '').toLowerCase();

  if (normalized === 'high') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
        High Risk
      </span>
    );
  }

  if (normalized === 'medium') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
        Medium Risk
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
      Low Risk
    </span>
  );
}

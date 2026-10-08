import React from 'react';
import { Search } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Search,
  title = 'No records found',
  description = 'Try adjusting your search query or filters to find what you are looking for.',
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-navy-900/60 border border-navy-800 rounded-xl">
      <div className="p-3 rounded-full bg-navy-800 border border-navy-700 text-slate-400 mb-3">
        <Icon className="h-6 w-6 stroke-1" />
      </div>
      <h4 className="text-sm font-semibold font-heading text-slate-100">{title}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

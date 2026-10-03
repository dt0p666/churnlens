import React from 'react';
import Card from './Card';

export default function ChartCard({ title, subtitle, rightAction, children, className = '' }) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold font-heading text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
      <div>{children}</div>
    </Card>
  );
}

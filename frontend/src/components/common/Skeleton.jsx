import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-navy-800/80 rounded-lg ${className}`} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-card">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-36 mb-2" />
      <Skeleton className="h-3 w-48 mt-4" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-card">
      <Skeleton className="h-4 w-40 mb-2" />
      <Skeleton className="h-3 w-64 mb-6" />
      <Skeleton className="h-60 w-full" />
    </div>
  );
}

export default Skeleton;


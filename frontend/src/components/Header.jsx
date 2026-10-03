import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Activity, Database, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Header({ title, subtitle }) {
  const [health, setHealth] = useState(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getHealth()
      .then((data) => {
        if (isMounted) {
          setHealth(data);
          setOnline(data.status === 'healthy');
        }
      })
      .catch(() => {
        if (isMounted) setOnline(false);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <header className="h-16 px-8 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm flex items-center justify-between flex-shrink-0">
      <div>
        <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Backend Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          {online ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-medium">API Connected</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <span className="text-slate-400 font-medium">Local Mock / Standby</span>
            </>
          )}
        </div>

        {/* Database indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-400">
          <Database className="h-3.5 w-3.5 text-slate-400" />
          <span>SQLite / PG Audit</span>
        </div>
      </div>
    </header>
  );
}

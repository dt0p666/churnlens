import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Menu, Database, ShieldCheck, Activity } from 'lucide-react';

export default function Header({ onMenuClick = () => {} }) {
  const [online, setOnline] = useState(false);
  const [modelVersion, setModelVersion] = useState('v1.0.0');

  useEffect(() => {
    api.getHealth()
      .then((data) => {
        setOnline(data.status === 'healthy');
        if (data.version) setModelVersion(data.version);
      })
      .catch(() => setOnline(false));
  }, []);

  return (
    <header className="h-16 px-6 border-b border-navy-800 bg-navy-950/70 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-850 md:hidden transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-xs font-mono font-medium text-slate-400 hidden sm:inline-block">
          CHURNLENS <span className="text-slate-600">/</span> ENTERPRISE RADAR
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Model Version Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-900 border border-navy-750 text-xs font-mono text-slate-300">
          <Activity className="h-3.5 w-3.5 text-cyanAccent" />
          <span>{modelVersion}</span>
        </div>

        {/* API Health Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 border border-navy-750 text-xs font-mono">
          <span className={`h-2 w-2 rounded-full ${online ? 'bg-cyanAccent animate-pulse shadow-[0_0_8px_#22D3EE]' : 'bg-amber-400'}`} />
          <span className="text-slate-300">{online ? 'API ONLINE' : 'STANDBY'}</span>
        </div>
      </div>
    </header>
  );
}

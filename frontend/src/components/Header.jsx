import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { Menu, Activity, Coins } from 'lucide-react';
import ChurnLensLogo from './common/ChurnLensLogo';

export default function Header({ onMenuClick = () => {} }) {
  const [modelVersion, setModelVersion] = useState('v1.0.0');
  const { currency, setCurrency, rates } = useCurrency();

  useEffect(() => {
    api.getHealth()
      .then((data) => {
        if (data.version) setModelVersion(data.version);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-navy-800 bg-navy-950/70 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-navy-850 md:hidden transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {/* Mobile-only brand display */}
        <div className="md:hidden">
          <ChurnLensLogo size={26} color="#4A2E1B" accentColor="#D4A373" />
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Currency Selector Dropdown */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-navy-900 border border-navy-800 text-xs font-mono">
          <Coins className="h-3.5 w-3.5 text-cyanAccent" />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer pr-1"
            title="Display Currency (Converted from Base USD)"
          >
            {Object.entries(rates).map(([code, cfg]) => (
              <option key={code} value={code} className="bg-navy-900 text-slate-200">
                {cfg.symbol} {code}
              </option>
            ))}
          </select>
        </div>

        {/* Model Version Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-navy-900 border border-navy-800 text-xs font-mono text-slate-300">
          <Activity className="h-3.5 w-3.5 text-cyanAccent" />
          <span>{modelVersion}</span>
        </div>
      </div>
    </header>
  );
}

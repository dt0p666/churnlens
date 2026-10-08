import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import ChurnLensLogo from './common/ChurnLensLogo';

export default function Footer() {
  const { currency, currentCfg, referenceDate } = useCurrency();

  return (
    <footer className="mt-12 pt-6 pb-6 border-t border-navy-800 text-[11px] font-mono text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ChurnLensLogo size={16} showText={false} color="#4A2E1B" />
        <span className="text-slate-400 font-medium">ChurnLens</span>
        <span>•</span>
        <span className="text-slate-400">app.churnlens.io</span>
        <span>•</span>
        <span>IBM Telco Benchmark (7,043 Records)</span>
        <span>•</span>
        <span>Production Engine v1.0.0</span>
      </div>

      <div className="flex items-center gap-4 text-slate-400">
        <Link to="/privacy" className="hover:text-cyanAccent transition-colors">
          Privacy Policy
        </Link>
        <span>•</span>
        <Link to="/terms" className="hover:text-cyanAccent transition-colors">
          Terms of Service
        </Link>
        <span>•</span>
        <span>{currency} ({currentCfg.symbol}) @ {currentCfg.rate}</span>
      </div>
    </footer>
  );
}

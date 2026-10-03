import React from 'react';
import { NavLink } from 'react-router-dom';
import RadarLens from './common/RadarLens';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  FileSpreadsheet, 
  SlidersHorizontal, 
  BarChart3, 
  Cpu, 
  Settings,
  ShieldCheck,
  Zap
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users, badge: 'Live Data' },
  { to: '/predict', label: 'Single Prediction', icon: UserCheck },
  { to: '/batch', label: 'Batch Scoring', icon: FileSpreadsheet },
  { to: '/what-if', label: 'What-If Simulator', icon: SlidersHorizontal, badge: 'Flagship' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/model-info', label: 'Model Intelligence', icon: Cpu },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen = true, onClose = () => {} }) {
  return (
    <>
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-navy-900 border-r border-navy-800 flex flex-col flex-shrink-0 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-navy-800 bg-navy-950/40">
          <div className="flex items-center gap-3">
            <RadarLens size={24} />
            <div>
              <h1 className="font-heading font-bold text-base tracking-tight text-white flex items-center gap-1">
                CHURN<span className="text-cyanAccent">LENS</span>
              </h1>
              <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">The Churn Radar</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-cyanAccent/10 text-cyanAccent border border-cyanAccent/30 shadow-inner-glow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-navy-850'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono uppercase font-semibold px-1.5 py-0.5 rounded bg-cyanAccent/15 text-cyanAccent">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Model Spec Footer */}
        <div className="p-4 border-t border-navy-800 bg-navy-950/60">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400">Model v1.0.0</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ACTIVE
            </span>
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">
            XGBoost &bull; ROC-AUC 0.854
          </p>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}

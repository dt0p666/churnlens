import React from 'react';
import { NavLink } from 'react-router-dom';
import ChurnLensLogo from './common/ChurnLensLogo';
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
        <div className="h-16 px-5 flex items-center justify-between border-b border-navy-800 bg-navy-950/40">
          <NavLink to="/" className="flex items-center hover:opacity-90 transition-opacity">
            <ChurnLensLogo size={32} color="#4A2E1B" accentColor="#D4A373" />
          </NavLink>
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
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all duration-150 ${
                    isActive
                      ? 'bg-navy-800/60 text-[#4A2E1B] font-bold border border-navy-800 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-navy-800/30 font-medium'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono uppercase font-semibold px-1.5 py-0.5 rounded bg-navy-800/80 text-[#4A2E1B] border border-navy-800">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
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

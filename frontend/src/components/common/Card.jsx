import React from 'react';

export default function Card({ children, className = '', hover = false, glow = false }) {
  return (
    <div
      className={`bg-navy-900 border border-navy-800 rounded-xl shadow-card shadow-inner-glow transition-all duration-300 ${
        hover ? 'hover:border-navy-700 hover:shadow-cyan-glow/20 hover:-translate-y-0.5' : ''
      } ${glow ? 'border-cyanAccent/30 shadow-cyan-glow' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

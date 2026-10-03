import React from 'react';
import { motion } from 'framer-motion';

export default function RadialGauge({ value = 0, size = 180, label = 'Churn Risk', showLabel = true }) {
  // Value is expected 0 to 1 (or 0 to 100)
  const pct = value > 1 ? Math.min(100, Math.max(0, value)) : Math.min(100, Math.max(0, value * 100));

  // Determine color by risk tier
  let color = '#10B981'; // emerald
  let glowColor = 'rgba(16, 185, 129, 0.3)';
  let riskText = 'LOW';

  if (pct >= 60) {
    color = '#F43F5E'; // rose/coral
    glowColor = 'rgba(244, 63, 94, 0.4)';
    riskText = 'HIGH';
  } else if (pct >= 35) {
    color = '#F59E0B'; // amber
    glowColor = 'rgba(245, 158, 11, 0.4)';
    riskText = 'MEDIUM';
  }

  // Semi-circle gauge (180 to 360 deg or 240 deg arc)
  const strokeWidth = 12;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 240-degree open gauge arc
  const arcLength = circumference * 0.75;
  const offset = arcLength - (pct / 100) * arcLength;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-[135deg]" viewBox={`0 0 ${size} ${size}`}>
        {/* Track Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#15223C"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />

        {/* Dynamic Sweeping Value Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={arcLength}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
        />
      </svg>

      {/* Center Readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center mt-2">
        <motion.span
          className="text-3xl font-extrabold font-mono tracking-tight text-white"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {pct.toFixed(1)}%
        </motion.span>
        {showLabel && (
          <span className="text-[11px] font-mono tracking-wider font-semibold uppercase mt-0.5" style={{ color }}>
            {riskText} RISK
          </span>
        )}
      </div>
    </div>
  );
}

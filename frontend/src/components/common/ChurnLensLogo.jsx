import React from 'react';

/**
 * ChurnLens Brand Logo
 * Accurately reproduces the custom brand mark:
 * - Magnifying lens with top-left data-breakout pixel cluster
 * - 3 ascending metric bars inside the lens
 * - High-contrast espresso & caramel typography complementing the warm palette
 */
export default function ChurnLensLogo({
  className = '',
  size = 32,
  showText = true,
  color = '#4A2E1B',       // Deep rich espresso brown
  accentColor = '#B47B49', // Warm ochre caramel accent
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-label="ChurnLens Logo Mark"
      >
        {/* Pixel Data Blocks Dispersing from Top-Left Rim */}
        <rect x="29" y="14" width="6.5" height="6.5" rx="1.2" fill={color} />
        <rect x="21" y="22" width="6.5" height="6.5" rx="1.2" fill={color} />
        <rect x="37" y="22" width="6.5" height="6.5" rx="1.2" fill={color} />
        <rect x="29" y="30" width="6.5" height="6.5" rx="1.2" fill={color} />
        <rect x="45" y="30" width="6.5" height="6.5" rx="1.2" fill={color} />
        <rect x="21" y="38" width="6.5" height="6.5" rx="1.2" fill={color} />

        {/* Magnifying Lens Circle Rim (open top-left arc) */}
        <path
          d="M 54 18.5 A 25 25 0 1 1 24.5 54"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Magnifying Glass Handle (tilted bottom-right) */}
        <line
          x1="65.5"
          y1="64.5"
          x2="84.5"
          y2="83.5"
          stroke={color}
          strokeWidth="7.5"
          strokeLinecap="round"
        />

        {/* 3 Ascending Metric Bars inside the Lens */}
        <rect x="36.5" y="44" width="6" height="13" rx="2" fill={accentColor} />
        <rect x="45.5" y="36" width="6" height="21" rx="2" fill={color} />
        <rect x="54.5" y="27" width="6" height="30" rx="2" fill={color} />
      </svg>

      {/* Brand Wordmark */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline font-heading tracking-wide font-extrabold text-[15px]">
            <span style={{ color }}>CHURN</span>
            <span className="ml-1" style={{ color: accentColor }}>LENS</span>
          </div>
          <span className="text-[9px] font-mono tracking-widest uppercase mt-0.5" style={{ color: '#78716C' }}>
            Retention Radar
          </span>
        </div>
      )}
    </div>
  );
}

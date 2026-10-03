import React from 'react';

export default function RadarLens({ size = 28, className = '' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Outer Rotating Ring */}
      <div className="absolute inset-0 rounded-full border border-cyanAccent/40 animate-[spin_8s_linear_infinite]" />
      
      {/* Middle Pulse Ring */}
      <div className="absolute inset-1 rounded-full border border-violetAccent/30 animate-ping opacity-25" />
      
      {/* Inner Lens Concentric Ring */}
      <div className="absolute inset-1.5 rounded-full border border-cyanAccent/60" />
      
      {/* Reticle Crosshairs */}
      <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyanAccent/60 to-transparent" />
      <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-cyanAccent/60 to-transparent" />

      {/* Core Pupil / Radar Ping */}
      <div className="h-2 w-2 rounded-full bg-cyanAccent shadow-[0_0_10px_#22D3EE] z-10" />
    </div>
  );
}

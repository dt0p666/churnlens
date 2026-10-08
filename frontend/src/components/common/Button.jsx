import React from 'react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon = null,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const variantStyles = {
    primary: 'bg-cyanAccent hover:bg-cyanAccent-light text-navy-950 font-bold shadow-cyan-glow focus:ring-cyanAccent',
    secondary: 'bg-navy-850 hover:bg-navy-800 text-slate-200 border border-navy-750 focus:ring-navy-700',
    ghost: 'bg-transparent hover:bg-navy-800 text-slate-300 hover:text-slate-100 focus:ring-navy-700',
    danger: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 focus:ring-rose-500',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-xs font-semibold rounded-lg gap-2',
    lg: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2.5',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-navy-950 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

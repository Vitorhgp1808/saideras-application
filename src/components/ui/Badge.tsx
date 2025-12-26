import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-500',
    warning: 'bg-amber-500/10 text-amber-500',
    danger: 'bg-red-500/10 text-red-500',
    neutral: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
    info: 'bg-blue-500/10 text-blue-500',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}